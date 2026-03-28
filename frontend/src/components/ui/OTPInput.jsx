import { useRef, useState } from 'react';

export const OTPInput = ({ onComplete, disabled }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    if (index < 3) {
      inputsRef.current[index + 1].focus();
    }
    
    // Check if full OTP is entered
    if (newOtp.every(d => d !== '') && index === 3) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
    if (e.key === 'Backspace') {
       const newOtp = [...otp];
       newOtp[index] = '';
       setOtp(newOtp);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    if (pasted.length === 4) onComplete(pasted);
    if (pasted.length < 4) inputsRef.current[pasted.length].focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => inputsRef.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-12 h-14 text-center text-2xl font-body font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-farm-gold focus:border-transparent
            ${digit ? 'border-farm-green bg-green-50 text-green-800' : 'border-gray-300 bg-white'}`}
        />
      ))}
    </div>
  );
};
