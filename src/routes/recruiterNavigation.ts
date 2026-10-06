import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  FileUser,
  ListChecks,
  PhoneCall,
  Send,
  Users,
} from "lucide-react";

import type { NavigationGroup } from "./navigation";

export const recruiterNavigation: NavigationGroup[] = [
  {
    label: "Recruitment",
    icon: BriefcaseBusiness,
    items: [
      {
        label: "Dashboard",
        path: "/recruiter",
        icon: BarChart3,
      },
      {
        label: "Job Openings",
        path: "/recruiter/jobs",
        icon: BriefcaseBusiness,
      },
      {
        label: "Candidates",
        path: "/recruiter/candidates",
        icon: FileUser,
      },
      {
        label: "Applications",
        path: "/recruiter/applications",
        icon: ClipboardCheck,
      },
    ],
  },

  {
    label: "Leads",
    icon: Users,
    items: [
      {
        label: "All Leads",
        path: "/recruiter/leads",
        icon: Users,
      },
      {
        label: "Lead Pipeline",
        path: "/recruiter/leads/pipeline",
        icon: ListChecks,
      },
      {
        label: "Follow-ups",
        path: "/recruiter/leads/follow-ups",
        icon: PhoneCall,
      },
    ],
  },

  {
    label: "Hiring",
    icon: Users,
    items: [
      {
        label: "Screening",
        path: "/recruiter/screening",
        icon: ClipboardCheck,
      },
      {
        label: "Interviews",
        path: "/recruiter/interviews",
        icon: CalendarCheck,
      },
      {
        label: "Interview Feedback",
        path: "/recruiter/interview-feedback",
        icon: ClipboardCheck,
      },
      {
        label: "Offers",
        path: "/recruiter/offers",
        icon: Send,
      },
      {
        label: "Hired",
        path: "/recruiter/hired",
        icon: Users,
      },
    ],
  },

  {
    label: "Analytics",
    icon: BarChart3,
    items: [
      {
        label: "Recruitment Pipeline",
        path: "/recruiter/pipeline",
        icon: ListChecks,
      },
      {
        label: "Recruitment Analytics",
        path: "/recruiter/analytics",
        icon: BarChart3,
      },
    ],
  },
];