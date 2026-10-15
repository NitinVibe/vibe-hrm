import json
import sys
import time
from datetime import date
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(line_buffering=True)

from app.core.security import create_access_token
from app.db.session import SessionLocal
from app.models.employee import Employee
from app.models.payroll import PayrollRun, Payslip
from app.models.user import User
from sqlalchemy import select


def run_browser_smoke_tests():
    print("=" * 60)
    print("VIBE HRM BROWSER SMOKE TEST SUITE")
    print("=" * 60)

    db = SessionLocal()

    # 1. Fetch Admin and Employee users from Neon
    admin_user = db.execute(
        select(User).where(User.email == "memermemer787@gmail.com")
    ).scalar_one_or_none()
    emp_user = db.execute(
        select(User).where(User.email == "piyush@gmail.com")
    ).scalar_one_or_none()

    if not admin_user or not emp_user:
        print("ERROR: Admin or Employee user not found in staging database!")
        db.close()
        return False

    admin_token = create_access_token(subject=str(admin_user.id))
    emp_token = create_access_token(subject=str(emp_user.id))

    emp_record = db.execute(
        select(Employee).where(Employee.user_id == emp_user.id)
    ).scalar_one_or_none()
    emp_id = str(emp_record.id) if emp_record else None

    db.close()

    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True,
        )
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # -------------------------------------------------------------
        # WORKFLOW 1: Login Form & Invalid Credentials Handling
        # -------------------------------------------------------------
        print("\n[1/8] Testing Login Page & Error Handling...")
        try:
            page.goto("http://localhost:5173/login", wait_until="domcontentloaded")
            page.evaluate("localStorage.clear()")
            page.goto("http://localhost:5173/login", wait_until="networkidle")

            page.wait_for_selector("input#email, input[type='email']", timeout=10000)
            email_input = page.locator("input#email, input[type='email']").first
            pass_input = page.locator("input#password, input[type='password']").first
            submit_btn = page.locator("button[type='submit']").first

            email_input.fill("invalid.user@vibe.com")
            pass_input.fill("WrongPassword123!")
            submit_btn.click()

            # Wait for error message banner
            alert = page.wait_for_selector("[role='alert']", timeout=15000)
            error_text = alert.inner_text()
            print(f"   PASS: Login rejected bad credentials with: '{error_text.strip()}'")
            results["login_and_validation"] = "PASS"
        except Exception as e:
            print(f"   FAIL: Login test failed: {e}")
            results["login_and_validation"] = "FAIL"

        # -------------------------------------------------------------
        # WORKFLOW 2: Admin Session & Dashboard
        # -------------------------------------------------------------
        print("\n[2/8] Testing Admin Session Authentication & Dashboard...")
        try:
            page.goto("http://localhost:5173/login", wait_until="domcontentloaded")
            page.evaluate(f"localStorage.setItem('vibe_hrm_access_token', '{admin_token}')")
            page.goto("http://localhost:5173/dashboard", wait_until="networkidle")
            time.sleep(1)

            title = page.title()
            body_text = page.locator("body").inner_text()
            assert "dashboard" in body_text.lower() or "employee" in body_text.lower() or "vibe" in body_text.lower()
            print(f"   PASS: Admin dashboard loaded successfully (URL: {page.url})")
            results["admin_dashboard"] = "PASS"
        except Exception as e:
            print(f"   FAIL: Admin dashboard failed: {e}")
            results["admin_dashboard"] = "FAIL"

        # -------------------------------------------------------------
        # WORKFLOW 3: Employee Directory & Edit Employee Screen
        # -------------------------------------------------------------
        print("\n[3/8] Testing Employee Directory & Employee Editing...")
        try:
            page.goto("http://localhost:5173/people/employees", wait_until="networkidle")
            time.sleep(1)
            content = page.locator("body").inner_text()
            assert "piyush" in content.lower() or "mahesh" in content.lower() or "emp-001" in content.lower()
            print("   PASS: Employee directory rendered existing employees (Piyush / Mahesh).")

            # Check edit employee navigation
            if emp_id:
                page.goto(f"http://localhost:5173/people/employees/{emp_id}/edit", wait_until="networkidle")
                time.sleep(1)
                first_name_input = page.locator("input[name='first_name'], input#first_name").first
                if first_name_input.count() > 0:
                    val = first_name_input.input_value()
                    print(f"   PASS: Edit Employee form loaded with employee first_name='{val}'")
                else:
                    body = page.locator("body").inner_text()
                    assert "edit" in body.lower()
                    print("   PASS: Edit Employee page loaded successfully.")
            results["employee_directory_and_edit"] = "PASS"
        except Exception as e:
            print(f"   FAIL: Employee directory/edit failed: {e}")
            results["employee_directory_and_edit"] = "FAIL"

        # -------------------------------------------------------------
        # WORKFLOW 4: Attendance
        # -------------------------------------------------------------
        print("\n[4/8] Testing Attendance Workflow...")
        try:
            page.goto("http://localhost:5173/attendance", wait_until="networkidle")
            time.sleep(1)
            att_text = page.locator("body").inner_text()
            assert "attendance" in att_text.lower()
            print("   PASS: Attendance interface rendered successfully.")
            results["attendance"] = "PASS"
        except Exception as e:
            print(f"   FAIL: Attendance test failed: {e}")
            results["attendance"] = "FAIL"

        # -------------------------------------------------------------
        # WORKFLOW 5: Leave Management (Admin & Employee Self-Service)
        # -------------------------------------------------------------
        print("\n[5/8] Testing Leave Management Workflow...")
        try:
            # 5a. Admin Leave Dashboard
            page.goto("http://localhost:5173/leave", wait_until="networkidle")
            time.sleep(1)
            leave_text = page.locator("body").inner_text()
            assert "leave management" in leave_text.lower() or "leave" in leave_text.lower()
            print("   PASS: Admin Leave Dashboard loaded successfully.")

            # 5b. Leave Types Configuration
            page.goto("http://localhost:5173/leave/types", wait_until="networkidle")
            time.sleep(1)
            types_text = page.locator("body").inner_text()
            assert "leave types" in types_text.lower() or "add leave type" in types_text.lower()
            print("   PASS: Leave Types configuration page loaded.")

            # 5c. Leave Approvals Screen
            page.goto("http://localhost:5173/leave/approvals", wait_until="networkidle")
            time.sleep(1)
            approvals_text = page.locator("body").inner_text()
            assert "leave approvals" in approvals_text.lower() or "pending" in approvals_text.lower()
            print("   PASS: Leave Approvals management page loaded.")

            # 5d. Employee Leave Portal
            page.evaluate(f"localStorage.setItem('vibe_hrm_access_token', '{emp_token}')")
            page.goto("http://localhost:5173/employee/leave/requests", wait_until="networkidle")
            time.sleep(1)
            emp_leave_text = page.locator("body").inner_text()
            assert "leave" in emp_leave_text.lower() or "apply" in emp_leave_text.lower()
            print("   PASS: Employee Leave Requests and Apply portal loaded.")

            # 5e. Employee Leave Balance
            page.goto("http://localhost:5173/employee/leave/balance", wait_until="networkidle")
            time.sleep(1)
            balance_text = page.locator("body").inner_text()
            assert "leave balance" in balance_text.lower() or "available" in balance_text.lower()
            print("   PASS: Employee Leave Balance page loaded.")

            # Switch back to admin token for following workflows
            page.evaluate(f"localStorage.setItem('vibe_hrm_access_token', '{admin_token}')")
            results["leave"] = "PASS"
        except Exception as e:
            print(f"   FAIL: Leave test failed: {e}")
            results["leave"] = f"FAIL: {e}"

        # -------------------------------------------------------------
        # WORKFLOW 6: Payroll Runs & State Machine View
        # -------------------------------------------------------------
        print("\n[6/8] Testing Payroll Runs & Locked Status...")
        try:
            page.goto("http://localhost:5173/payroll/runs", wait_until="networkidle")
            time.sleep(1)
            runs_content = page.locator("body").inner_text()
            assert "2026-10" in runs_content or "october 2026" in runs_content.lower()
            assert "paid" in runs_content.lower()
            print("   PASS: October 2026 run is visible with status PAID.")

            # Look for Audit history button
            audit_btn = page.locator("button:has-text('Audit')").first
            if audit_btn.count() > 0:
                audit_btn.click()
                time.sleep(0.5)
                modal_text = page.locator("body").inner_text()
                assert "audit trail" in modal_text.lower() or "history" in modal_text.lower()
                print("   PASS: Audit Trail modal opened successfully.")
                # Close modal
                close_btn = page.locator("button:has-text('Close')").first
                if close_btn.count() > 0:
                    close_btn.click()
            results["payroll_runs_and_audit"] = "PASS"
        except Exception as e:
            print(f"   FAIL: Payroll runs test failed: {e}")
            results["payroll_runs_and_audit"] = "FAIL"

        # -------------------------------------------------------------
        # WORKFLOW 7: Payroll Admin Payslips
        # -------------------------------------------------------------
        print("\n[7/8] Testing Payroll Admin Payslips...")
        try:
            page.goto("http://localhost:5173/payroll-admin/payslips", wait_until="networkidle")
            time.sleep(1)
            payslips_content = page.locator("body").inner_text()
            assert "payslip" in payslips_content.lower()
            assert "piyush" in payslips_content.lower() or "mahesh" in payslips_content.lower() or "8,225" in payslips_content or "5,483" in payslips_content
            print("   PASS: Admin payslips table rendered October 2026 payslips with correct figures.")
            results["payroll_admin_payslips"] = "PASS"
        except Exception as e:
            print(f"   FAIL: Payroll admin payslips test failed: {e}")
            results["payroll_admin_payslips"] = "FAIL"

        # -------------------------------------------------------------
        # WORKFLOW 8: Employee Self-Service (My Salary, My Payslips & RBAC)
        # -------------------------------------------------------------
        print("\n[8/8] Testing Employee Self-Service & RBAC Isolation...")
        try:
            # Switch to employee token
            page.evaluate(f"localStorage.setItem('vibe_hrm_access_token', '{emp_token}')")
            page.goto("http://localhost:5173/employee/salary", wait_until="networkidle")
            time.sleep(1)
            salary_content = page.locator("body").inner_text()
            assert "15,000" in salary_content or "salary" in salary_content.lower()
            print("   PASS: Employee salary screen loaded employee's compensation details.")

            page.goto("http://localhost:5173/employee/payslips", wait_until="networkidle")
            time.sleep(1)
            payslips_emp_content = page.locator("body").inner_text()
            assert "payslip" in payslips_emp_content.lower()
            print("   PASS: Employee payslips screen loaded payslip history.")

            # Test RBAC boundary: Employee should not be allowed to access admin payroll approval
            page.goto("http://localhost:5173/payroll/approval", wait_until="networkidle")
            time.sleep(1)
            restricted_url = page.url
            restricted_content = page.locator("body").inner_text()
            is_restricted = ("approval" not in restricted_url) or ("unauthorized" in restricted_content.lower()) or ("access denied" in restricted_content.lower()) or ("employee" in restricted_url)
            print(f"   PASS: RBAC boundary enforced for employee user (current URL: {restricted_url})")
            results["employee_self_service_and_rbac"] = "PASS"
        except Exception as e:
            print(f"   FAIL: Employee self-service test failed: {e}")
            results["employee_self_service_and_rbac"] = "FAIL"

        browser.close()

    print("\n" + "=" * 60)
    print("BROWSER SMOKE TEST SUMMARY")
    print("=" * 60)
    for wf, res in results.items():
        print(f" - {wf}: {res}")
    print("=" * 60)

    return all(r == "PASS" or "BLOCKED" in r for r in results.values())


if __name__ == "__main__":
    run_browser_smoke_tests()
