type MrhLogoProps = {
  size?: number;
  className?: string;
};

/**
 * Logo MRH — lit public/brand/logoMRH.png
 */
export function MrhLogo({ size = 44, className }: MrhLogoProps) {
  return (
    <img
      src="/brand/logoMRH.png"
      alt="Mon Risque Habitat"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
