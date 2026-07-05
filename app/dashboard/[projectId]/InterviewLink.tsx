import CopyButton from "./CopyButton";

export default function InterviewLink({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <input
        readOnly
        value={url}
        className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
      />
      <CopyButton text={url} />
    </div>
  );
}
