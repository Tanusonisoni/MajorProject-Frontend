
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./landingPage.css";
import bgImage from "../../assets/img.png";

function LandingPage({ onComplete }) {
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const completedRef = useRef(false);

  const message =
    "Learn about our planet. Take action. Make a difference.";

  useEffect(() => {
    let index = 0;

    const typingTimer = setInterval(() => {
      index++;
      setTypedText(message.slice(0, index));

      if (index >= message.length) {
        clearInterval(typingTimer);
      }
    }, 45);

    const slideTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 5300);

    return () => {
      clearInterval(typingTimer);
      clearTimeout(slideTimer);
    };
  }, []);

  const handleStart = () => {
    setIsLeaving(true);
  };

  const handleAnimationEnd = (event) => {
    if (
      event.target !== event.currentTarget ||
      event.animationName !== "landingSlideUp" ||
      completedRef.current
    ) {
      return;
    }

    completedRef.current = true;
    onComplete();
    navigate("/login", { replace: true });
  };

  return (
    <main
      className={`intro-page ${isLeaving ? "slide-up" : ""}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <img
        src={bgImage}
        alt="EcoQuest environment"
        className="intro-background"
      />

      <div className="intro-overlay" />

      <section className="intro-content">
        <h1 className="eco-title">
          <span>EcoQuest</span>
        </h1>

        <p className="typing-text">
          {typedText}
          {!isLeaving && (
            <span className="typing-cursor">|</span>
          )}
        </p>

        <button
          type="button"
          className="quest-button"
          onClick={handleStart}
          disabled={isLeaving}
        >
          Start Your Quest <span>→</span>
        </button>
      </section>
    </main>
  );
}

export default LandingPage;
