import { useState } from "react";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";

interface AuthPagesProps {
  onBackToCreators?: () => void;
}

export default function AuthPages({ onBackToCreators }: AuthPagesProps) {
  const [page, setPage] = useState<"login" | "signup">("login");

  return (
    <>
      {page === "login" ? (
        <LoginPage 
          onSwitchToSignup={() => setPage("signup")} 
          onBackToCreators={onBackToCreators}
        />
      ) : (
        <SignupPage 
          onSwitchToLogin={() => setPage("login")} 
          onBackToCreators={onBackToCreators}
        />
      )}
    </>
  );
}
