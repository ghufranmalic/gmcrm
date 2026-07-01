import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export { KpiGrid } from "@/components/portal/kpi-grid";

const HeadcountLineChart = dynamic(
  () => import("@/components/portal/hr-charts").then((module) => module.HeadcountLineChart),
  { loading: () => <Skeleton className="h-[280px]" /> }
);

const DistributionBarChart = dynamic(
  () => import("@/components/portal/hr-charts").then((module) => module.DistributionBarChart),
  { loading: () => <Skeleton className="h-[280px]" /> }
);

const DistributionPieChart = dynamic(
  () => import("@/components/portal/hr-charts").then((module) => module.DistributionPieChart),
  { loading: () => <Skeleton className="h-[280px]" /> }
);

export { HeadcountLineChart, DistributionBarChart, DistributionPieChart };
