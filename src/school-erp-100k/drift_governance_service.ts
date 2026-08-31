// MLOps model governance and drift alert service
export function checkDriftThreshold(psi: number, threshold = 0.25): { drifted: boolean; alertLevel: string } {
  return {
    drifted: psi > threshold,
    alertLevel: psi > threshold ? "HIGH" : "NORMAL"
  };
}
