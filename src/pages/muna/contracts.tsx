import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ContractsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/muna/contracts-monitor");
  }, [router]);

  return null;
}