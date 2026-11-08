// Tela de espera da Revela (sem depender do CSS da página, que chega junto).
export default function RevelaLoader() {
  return (
    <div role="status" aria-label="Carregando" style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#F7F5FA" }}>
      <style>{"@keyframes rvl{0%,100%{transform:scale(.7);opacity:.5}50%{transform:scale(1);opacity:1}}@media (prefers-reduced-motion:reduce){.rvl{animation:none!important}}"}</style>
      <i className="rvl" style={{ width: 14, height: 14, borderRadius: 999, background: "#C95D63", animation: "rvl 1.1s ease-in-out infinite" }} />
    </div>
  );
}
