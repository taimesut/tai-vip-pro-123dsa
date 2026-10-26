import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SettingsPage } from "./pages/SettingsPage";
import { CheckSotNgoaiTinhPage } from "./pages/CheckSotNgoaiTinhPage";
import { CheckSotNoiTinhPage } from "./pages/CheckSotNoiTinhPage";
import { MobileLayout } from "./layouts/MobileLayout";
import { HomePage } from "./pages/HomePage";
import { LayMaTOPage } from "./pages/LayMaTOPage";
import { TaoBienBanSuVuPage } from "./pages/TaoBienBanSuVuPage";
import { TaoMaQRPage } from "./pages/TaoMaQRPage";
import { ToastContainer } from "./components/Toast";
import { LicenseGate } from "./features/license/LicenseGate";

interface UserscriptAppProps {
  onRequestClose?: () => void;
}

export const UserscriptApp = ({ onRequestClose }: UserscriptAppProps) => {
  return (
    <div id="ops-fte-userscript-app" data-ops-fte-theme-root data-theme="light">
      <LicenseGate onRequestClose={onRequestClose}>
        <MemoryRouter>
          <ToastContainer />
          <MobileLayout onRequestClose={onRequestClose}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/check-sot/ngoai-tinh" element={<CheckSotNgoaiTinhPage />} />
              <Route path="/check-sot/noi-tinh" element={<CheckSotNoiTinhPage />} />
              <Route path="/cai-dat" element={<SettingsPage />} />
              <Route path="/tao-bien-ban-su-vu" element={<TaoBienBanSuVuPage />} />
              <Route path="/lay-ma-to" element={<LayMaTOPage />} />
              <Route path="/tao-ma-qr" element={<TaoMaQRPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </MobileLayout>
        </MemoryRouter>
      </LicenseGate>
    </div>
  );
};
