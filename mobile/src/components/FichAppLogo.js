import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

/**
 * Logo oficial de FichApp vectorizado en React Native SVG.
 * Basado en assets/fichapp.svg
 */
export default function FichAppLogo({
  width = 56,
  height = 56,
  colorEscudo = '#174D50', // Azul petróleo por defecto o blanco sobre fondo oscuro
  colorCheck = '#009B4D',  // Verde esmeralda oficial del logo
  style,
}) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 512 512"
      style={style}
    >
      <G transform="translate(-268, -148)">
        {/* Escudo */}
        <Path
          fill={colorEscudo}
          d="M 333 200 H 667 V 274 L 631 310 V 236 H 369 V 390 C 369 442, 379 480, 396 504 V 551 C 362 518, 333 468, 333 390 Z"
        />
        <Path
          fill={colorEscudo}
          d="M 460 535 L 500 563 L 555 524 C 605 488, 631 445, 631 408 L 667 372 V 405 C 667 475, 620 530, 565 568 L 500 612 L 460 584 Z"
        />
        {/* F + Check Unificado */}
        <Path
          fill={colorCheck}
          d="M 402 266 H 598 V 310 H 440 V 358 H 570 L 528 400 H 440 V 566 L 402 538 Z"
        />
        <Path
          fill={colorCheck}
          d="M 455 432 H 505 L 528 455 L 706 277 H 756 L 528 505 Z"
        />
      </G>
    </Svg>
  );
}
