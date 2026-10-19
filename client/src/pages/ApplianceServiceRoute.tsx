import ApplianceService, { applianceServices, type ApplianceServiceData } from "./ApplianceService";

type ApplianceServiceRouteProps = {
  serviceKey: keyof typeof applianceServices;
};

export default function ApplianceServiceRoute({ serviceKey }: ApplianceServiceRouteProps) {
  const service: ApplianceServiceData = applianceServices[serviceKey];
  return <ApplianceService service={service} />;
}
