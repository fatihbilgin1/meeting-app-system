import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Calendar from "../components/Calendar/Calendar";
import BookingForm from "../components/BookingForm/BookingForm";
import Success from "../components/Success/Success";
import StepIndicator from "../components/StepIndicator/StepIndicator";
import { refreshToken } from "../components/apiClient";

const SelectDateTime = () => {
  const { username } = useParams(); // Örn: fatihbilgin
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId"); // örnek: fatihbilgin-64e12a...

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [userData, setUserData] = useState(null);
  const [duration, setDuration] = useState(30); // varsayılan süre

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let token = localStorage.getItem("token");

        let res = await fetch(
          `http://localhost:8081/api/calendar/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.status === 401 || res.status === 403) {
          const newToken = await refreshToken();
          localStorage.setItem("token", newToken);

          // Yeni token ile isteği tekrar dene
          res = await fetch(
            `http://localhost:8081/api/calendar/user/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            }
          );
        }

        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        } else {
          console.log("Kullanıcı bulunamadı");
        }
      } catch (err) {
        console.error("İstek hatası:", err);
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  if (!userData)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          fontSize: "1.2rem",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Yükleniyor...
      </div>
    );

  return (
    <div className="container">
      <StepIndicator currentStep={step} />
      {step === 1 && (
        <Calendar
          username={username}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          duration={duration}
          setDuration={setDuration}
          onContinue={(time) => {
            setSelectedTime(time);
            setStep(2);
          }}
          userData={userData} // kullanıcının calendarId vs.
        />
      )}

      {step === 2 && (
        <BookingForm
          username={username}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          duration={duration}
          userId={userId}
          onBack={() => setStep(1)}
          onSuccess={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <Success
          username={username}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      )}
    </div>
  );
};

export default SelectDateTime;
