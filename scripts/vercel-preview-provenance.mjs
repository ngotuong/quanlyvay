export const EXPECTED_VERCEL = Object.freeze({
  projectId: "prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F",
  projectName: "quan-ly-vay-ca-nhan",
  orgId: "team_1BMzW3A2mFKTuGEyw1Z868Nx",
  orgSlug: "ngotuong2105",
  rootDirectory: "apps/web",
  region: "sin1",
  stableAlias: "tindung-preview.vercel.app",
});

function fail(message) {
  throw new Error(`Vercel provenance không hợp lệ: ${message}`);
}

function hostnameOf(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail("candidate phải là URL HTTPS hợp lệ.");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    !parsed.hostname.endsWith(".vercel.app")
  ) {
    fail("candidate phải là URL HTTPS Vercel không có path, query hoặc credential.");
  }
  return parsed.hostname.toLowerCase();
}

function singaporeFunctions(deployment, expected = EXPECTED_VERCEL) {
  const functions = deployment.builds
    ?.flatMap((build) => build.output ?? [])
    .filter((output) => output.type === "lambda" && output.lambda);
  return Boolean(functions?.length) && functions.every((output) => output.lambda.deployedTo?.includes(expected.region));
}

export function parseProjectInspection(rawOutput) {
  const output = rawOutput.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
  const qualified = output.match(/Found Project\s+([^\s/]+)\/([^\s[]+)/i);
  const projectId = output.match(/^ID\s+(prj_[A-Za-z0-9]+)\s*$/m)?.[1];
  const projectName = output.match(/^Name\s+([^\s]+)\s*$/m)?.[1];
  const rootDirectory = output.match(/^Root Directory\s+(.+?)\s*$/m)?.[1]?.trim();

  if (!qualified || !projectId || !projectName || !rootDirectory) {
    fail("không đọc đủ org/project ID/name/root từ `vercel project inspect`; schema CLI có thể đã đổi.");
  }

  return {
    orgSlug: qualified[1],
    qualifiedProjectName: qualified[2],
    projectId,
    projectName,
    rootDirectory,
  };
}

export function assertProjectProvenance(project, expected = EXPECTED_VERCEL) {
  if (project.orgSlug !== expected.orgSlug) fail(`org ${project.orgSlug} không phải ${expected.orgSlug}.`);
  if (project.projectId !== expected.projectId) fail(`project ID ${project.projectId} không phải ${expected.projectId}.`);
  if (project.projectName !== expected.projectName || project.qualifiedProjectName !== expected.projectName) {
    fail(`project name không phải ${expected.projectName}.`);
  }
  if (project.rootDirectory !== expected.rootDirectory) {
    fail(`Root Directory ${project.rootDirectory} không phải ${expected.rootDirectory}.`);
  }
  return project;
}

export function assertDeploymentProvenance({ requestedUrl, deployment, project }, expected = EXPECTED_VERCEL) {
  const requestedHost = hostnameOf(requestedUrl);
  const inspectedHost = String(deployment.url ?? "").toLowerCase();

  assertProjectProvenance(project, expected);
  if (deployment.name !== expected.projectName) fail(`deployment thuộc project ${deployment.name ?? "không rõ"}.`);
  if (!/^dpl_[A-Za-z0-9]+$/.test(deployment.id ?? "")) fail("deployment ID bị thiếu hoặc sai định dạng.");
  if (requestedHost === expected.stableAlias || requestedHost !== inspectedHost) {
    fail("candidate phải là immutable deployment URL trả trực tiếp bởi inspect, không phải alias.");
  }
  if (deployment.target !== "preview" || deployment.readyState !== "READY") {
    fail("deployment không đồng thời đạt target=preview và READY.");
  }
  if (!singaporeFunctions(deployment, expected)) fail(`không phải toàn bộ Functions đều ở ${expected.region}.`);

  return { deploymentId: deployment.id, deploymentUrl: `https://${inspectedHost}` };
}

export function assertPromotionProvenance({ candidate, rollback }, expected = EXPECTED_VERCEL) {
  const checkedCandidate = assertDeploymentProvenance(candidate, expected);
  const checkedRollback = assertDeploymentProvenance(rollback, expected);
  if (candidate.project.projectId !== rollback.project.projectId || candidate.project.orgSlug !== rollback.project.orgSlug) {
    fail("rollback target không thuộc cùng project/org với candidate.");
  }
  if (checkedCandidate.deploymentId === checkedRollback.deploymentId) {
    fail("candidate và rollback target không được là cùng deployment.");
  }
  return { candidate: checkedCandidate, rollback: checkedRollback };
}
