import React from "react";
import "./StepIndicator.css";

const StepIndicator = ({ currentStep }) => {
  return (
    <div className="stepper">
      <div className={`step ${currentStep === 1 ? "active" : ""}`}>
        <div className="circle">{currentStep > 1 ? "✔" : "1"}</div>
        <span>Zaman Seçin</span>
      </div>
      <div className="line" />
      <div className={`step ${currentStep === 2 ? "active" : ""}`}>
        <div className="circle">{currentStep > 2 ? "✔" : "2"}</div>
        <span>Bilgiler</span>
      </div>
    </div>
  );
};

export default StepIndicator;
