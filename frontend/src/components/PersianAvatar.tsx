import React from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
  name: string;
  role: 'doctor' | 'manager' | 'receptionist';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

/**
 * کمپوننت Avatar کارتر - با طراحی حرفه‌ای و المان‌های ایرانی
 * الهام‌گرفته از هنر و تمدن کهن ایران
 */

const DoctorAvatar: React.FC<{ size: string; animated: boolean }> = ({ size, animated }) => {
  const sizeMap = {
    small: 64,
    medium: 96,
    large: 128,
  };

  const containerVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const floatVariants = {
    animate: {
      y: [-5, 5, -5],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated
    ? {
        variants: containerVariants,
        initial: 'initial',
        animate: 'animate',
      }
    : {};

  const FloatWrapper = animated ? motion.div : 'div';
  const floatProps = animated
    ? {
        variants: floatVariants,
        animate: 'animate',
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50"
      style={{ width: sizeMap[size as keyof typeof sizeMap], height: sizeMap[size as keyof typeof sizeMap] }}
    >
      <FloatWrapper {...floatProps}>
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4 text-blue-600"
          fill="currentColor"
        >
          {/* سر */}
          <circle cx="50" cy="35" r="18" />
          
          {/* بدن */}
          <path d="M 50 55 Q 35 60 35 75 L 65 75 Q 65 60 50 55" />
          
          {/* گوشی‌های پزشکی */}
          <g transform="translate(28, 32) rotate(-20)">
            <circle cx="0" cy="0" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M -4 0 Q -8 5 -10 10" stroke="currentColor" strokeWidth="2" fill="none" />
          </g>
          <g transform="translate(72, 32) rotate(20)">
            <circle cx="0" cy="0" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M 4 0 Q 8 5 10 10" stroke="currentColor" strokeWidth="2" fill="none" />
          </g>

          {/* صلیب پزشکی */}
          <g transform="translate(50, 68)">
            <rect x="-2" y="-8" width="4" height="16" fill="currentColor" />
            <rect x="-8" y="-2" width="16" height="4" fill="currentColor" />
          </g>
        </svg>
      </FloatWrapper>
    </Wrapper>
  );
};

const ManagerAvatar: React.FC<{ size: string; animated: boolean }> = ({ size, animated }) => {
  const sizeMap = {
    small: 64,
    medium: 96,
    large: 128,
  };

  const containerVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const spinVariants = {
    animate: {
      rotateZ: [0, 5, -5, 0],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated
    ? {
        variants: containerVariants,
        initial: 'initial',
        animate: 'animate',
      }
    : {};

  const SpinWrapper = animated ? motion.div : 'div';
  const spinProps = animated
    ? {
        variants: spinVariants,
        animate: 'animate',
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-50"
      style={{ width: sizeMap[size as keyof typeof sizeMap], height: sizeMap[size as keyof typeof sizeMap] }}
    >
      <SpinWrapper {...spinProps}>
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4 text-amber-600"
          fill="currentColor"
        >
          {/* سر */}
          <circle cx="50" cy="32" r="16" />

          {/* بدن - کت رسمی */}
          <path d="M 50 50 Q 35 55 30 70 L 70 70 Q 65 55 50 50" />
          
          {/* کراوات */}
          <path d="M 48 48 L 46 60 L 54 60 L 52 48" fill="currentColor" />
          
          {/* شانه‌ها */}
          <g>
            <circle cx="30" cy="55" r="6" />
            <circle cx="70" cy="55" r="6" />
          </g>

          {/* نشان تاج - نماد مدیریت */}
          <g transform="translate(50, 16)">
            <circle cx="0" cy="0" r="3" fill="currentColor" />
            <polygon points="-4,-2 -2,-6 0,-2 2,-6 4,-2" fill="currentColor" />
          </g>
        </svg>
      </SpinWrapper>
    </Wrapper>
  );
};

const ReceptionistAvatar: React.FC<{ size: string; animated: boolean }> = ({ size, animated }) => {
  const sizeMap = {
    small: 64,
    medium: 96,
    large: 128,
  };

  const containerVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated
    ? {
        variants: containerVariants,
        initial: 'initial',
        animate: 'animate',
      }
    : {};

  const PulseWrapper = animated ? motion.div : 'div';
  const pulseProps = animated
    ? {
        variants: pulseVariants,
        animate: 'animate',
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-50"
      style={{ width: sizeMap[size as keyof typeof sizeMap], height: sizeMap[size as keyof typeof sizeMap] }}
    >
      <PulseWrapper {...pulseProps}>
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4 text-green-600"
          fill="currentColor"
        >
          {/* سر */}
          <circle cx="50" cy="32" r="16" />

          {/* بدن */}
          <path d="M 50 50 Q 35 55 32 72 L 68 72 Q 65 55 50 50" />

          {/* تلفن در دست */}
          <g transform="translate(70, 60) rotate(-15)">
            <rect x="0" y="0" width="8" height="14" rx="2" fill="currentColor" />
            <rect x="1" y="1" width="6" height="8" fill="white" opacity="0.3" />
          </g>

          {/* لبخند - شادی خدمت */}
          <g transform="translate(50, 35)">
            <path d="M -6 2 Q 0 4 6 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="-4" cy="0" r="1.5" fill="currentColor" />
            <circle cx="4" cy="0" r="1.5" fill="currentColor" />
          </g>

          {/* نماد پذیرش - ستاره */}
          <g transform="translate(20, 25)">
            <polygon points="0,-4 1.2,-1.2 4,-1 1.2,1 2,4 0,1.2 -2,4 -1.2,1 -4,-1 -1.2,-1.2" fill="currentColor" />
          </g>
        </svg>
      </PulseWrapper>
    </Wrapper>
  );
};

/**
 * کمپوننت اصلی Avatar
 */
export const PersianAvatar: React.FC<AvatarProps> = ({
  name,
  role,
  size = 'medium',
  animated = true,
}) => {
  const getAvatar = () => {
    switch (role) {
      case 'doctor':
        return <DoctorAvatar size={size} animated={animated} />;
      case 'manager':
        return <ManagerAvatar size={size} animated={animated} />;
      case 'receptionist':
        return <ReceptionistAvatar size={size} animated={animated} />;
      default:
        return <DoctorAvatar size={size} animated={animated} />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {getAvatar()}
        {/* نور محیط - الهام از هنر ایرانی */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 to-transparent opacity-20 blur-lg" />
      </div>
      {name && (
        <div className="text-center">
          <p className="font-bold text-gray-800">{name}</p>
          <p className="text-xs text-gray-500">
            {role === 'doctor' && 'پزشک'}
            {role === 'manager' && 'مدیر'}
            {role === 'receptionist' && 'پذیرش'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PersianAvatar;
