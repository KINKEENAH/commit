import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-10 px-6 md:px-12 py-10 md:py-14 bg-#0B0B0F">
      <div className="flex-1 md:flex-[1.15]">
        <p className="font-sans text-sm font-medium text-[#F4F1F2]">commit.</p>
        <p className="font-mono text-xs font-normal text-[#92909A]">$ ./confess</p>
        <h1>Some things are easier to code than to say</h1>
        <p>Turn your feelings into something only you know how to decode</p>
        <Link to="/create">Write a confession →</Link>
        <p>No login. No name. Just the code</p>
      </div>
      <div className="flex-1"></div>
    </div>
  );
}
