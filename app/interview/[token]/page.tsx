import InterviewChat from "./InterviewChat";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InterviewChat token={token} />;
}
