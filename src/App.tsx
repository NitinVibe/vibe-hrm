import { BrowserRouter, Route, Routes } from "react-router-dom";

import AppShell from "./components/layout/AppShell";
import PlaceholderPage from "./pages/PlaceholderPage";
import { pageRoutes } from "./routes/pageRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {pageRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}

          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}