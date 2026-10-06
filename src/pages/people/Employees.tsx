import {
    // Download,
    Plus,
    Search,
    SlidersHorizontal,
    Users,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import { useNavigate } from "react-router-dom";
export default function Employees() {
    const navigate = useNavigate();
    return (
        <div>
            <PageHeader
                title="Employees"
                description="Manage your organization's workforce"
                actions={
                    <>
                        <Button onClick={() => navigate("/people/employees/new")}>
                            <Plus size={16} />
                            Add Employee
                        </Button>

                        <Button>
                            <Plus size={16} />
                            Add Employee
                        </Button>
                    </>
                }
            />

            {/* Filters */}
            <Card className="mb-4">
                <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-indigo-400">
                        <option value="">All Departments</option>
                    </select>

                    <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-indigo-400">
                        <option value="">All Status</option>
                    </select>

                    <Button variant="outline">
                        <SlidersHorizontal size={15} />
                        Filters
                    </Button>
                </div>
            </Card>

            {/* Employee table */}
            <Card>
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-800">
                            Employee Directory
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-400">
                            Employees across the organization
                        </p>
                    </div>
                </div>

                <EmptyState
                    icon={Users}
                    title="No employees found"
                    description="Employees will appear here once they are added to the organization."
                    action={
                        <Button onClick={() => navigate("/people/employees/new")}>
                            <Plus size={15} />
                            Add Employee
                        </Button>
                    }
                />
            </Card>
        </div>
    );
}