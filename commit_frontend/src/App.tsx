import { Routes, Route } from "react-router";
import Landing from "./pages/Landing";
import CreateConfession from "./pages/CreateConfession";
import Preview from "./pages/Preview";
import Recipient from "./pages/Recipient";
import Send from "./pages/Send";
import Status from "./pages/Status";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/create" element={<CreateConfession />} />
      <Route path="/preview" element={<Preview />} />
      {/* :id is the unique per-recipient token, e.g. commit.app/r/x7f2k9 */}
      <Route path="/r/:id" element={<Recipient />} />
      <Route path="/send" element={<Send />} />
      <Route path="/status" element={<Status />} />
      {/* Catches any URL that doesn't match one of the above, instead of
          rendering a blank screen. Must stay last — routes are matched in
          order, and "*" matches everything. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
