import React from "react";

const Privacy: React.FC = () => {
  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "auto",
      }}
    >
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        This application uses Google OAuth to authenticate users. We only access
        your basic profile information (name, email, and profile picture) to
        enable login functionality. We do not share your personal information
        with third parties.
      </p>
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at{" "}
        <a href="mailto:your-email@example.com">your-email@example.com</a>.
      </p>
    </div>
  );
};

export default Privacy;
