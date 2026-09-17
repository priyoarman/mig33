import type { Metadata } from "next";
import GetAppOnboarding from "../components/GetAppOnboarding";

export const metadata: Metadata = {
  title: "Get mig33",
  description: "Install mig33 on your phone",
};

const InstallPage = () => {
  return <GetAppOnboarding />;
};

export default InstallPage;
