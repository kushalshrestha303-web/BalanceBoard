import Navigation from "./Navigation";

function Layout({ children }) {
  return (
    <>
      <Navigation />

      <main className="main-content">
        {children}
      </main>
    </>
  );
}

export default Layout;