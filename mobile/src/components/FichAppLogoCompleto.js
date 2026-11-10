import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

/**
 * FichAppLogoCompleto — Logotipo oficial con Isotipo (Escudo + Check) 
 * y Tipografía trazada "FichApp" integrada vectorialmente.
 * Basado en assets/fichapp-2.svg
 */
export default function FichAppLogoCompleto({
  width = 140,
  height = 140,
  colorEscudo = '#FFFFFF',
  colorCheck = '#B9E44A', // Verde Lima de acento deportivo o #009B4D
  colorTextoFich = '#FFFFFF',
  colorTextoApp = '#B9E44A',
  style,
}) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 1000 1000"
      style={style}
    >
      {/* ISOTIPO: Escudo + F + Check */}
      <G id="isotipo">
        {/* Escudo Superior e Izquierdo */}
        <Path
          fill={colorEscudo}
          d="M 333 200 H 667 V 274 L 631 310 V 236 H 369 V 390 C 369 442, 379 480, 396 504 V 551 C 362 518, 333 468, 333 390 Z"
        />
        {/* Escudo Inferior y Derecho */}
        <Path
          fill={colorEscudo}
          d="M 460 535 L 500 563 L 555 524 C 605 488, 631 445, 631 408 L 667 372 V 405 C 667 475, 620 530, 565 568 L 500 612 L 460 584 Z"
        />
        {/* Letra F */}
        <Path
          fill={colorCheck}
          d="M 402 266 H 598 V 310 H 440 V 358 H 570 L 528 400 H 440 V 566 L 402 538 Z"
        />
        {/* Check Principal */}
        <Path
          fill={colorCheck}
          d="M 455 432 H 505 L 528 455 L 706 277 H 756 L 528 505 Z"
        />
      </G>

      {/* LOGOTIPO: Tipografía Vectorizada "FichApp" */}
      <G id="logotipo" transform="translate(-35.5, 10)">
        {/* "Fich" */}
        <G fill={colorTextoFich} fillRule="evenodd">
          {/* F */}
          <Path d="M 172 644 H 254 V 668 H 201 V 690 H 246 V 713 H 201 V 764 H 172 Z" />
          {/* i */}
          <Path d="M 268 638 H 297 V 662 H 268 Z M 268 674 H 297 V 764 H 268 Z" />
          {/* c */}
          <Path d="M 382 698 C 376 691, 368 688, 359 688 C 344 688, 334 699, 334 716 C 334 733, 344 744, 359 744 C 368 744, 376 741, 382 734 L 399 751 C 389 761, 375 766, 358 766 C 326 766, 305 746, 305 716 C 305 686, 326 666, 358 666 C 375 666, 389 671, 399 681 Z" />
          {/* h */}
          <Path d="M 412 638 H 441 V 682 C 448 671, 460 666, 474 666 C 497 666, 512 681, 512 707 V 764 H 483 V 712 C 483 697, 475 689, 463 689 C 450 689, 441 698, 441 713 V 764 H 412 Z" />
        </G>

        {/* "App" */}
        <G fill={colorTextoApp} fillRule="evenodd">
          {/* A */}
          <Path d="M 578 644 H 608 L 656 764 H 625 L 615 738 H 570 L 560 764 H 530 Z M 578 715 H 607 L 593 676 Z" />
          {/* p */}
          <Path d="M 670 668 H 698 V 681 C 705 671, 717 666, 731 666 C 758 666, 777 686, 777 716 C 777 746, 758 766, 731 766 C 718 766, 706 761, 699 752 V 798 H 670 Z M 723 689 C 709 689, 699 700, 699 716 C 699 732, 709 743, 723 743 C 738 743, 748 732, 748 716 C 748 700, 738 689, 723 689 Z" />
          {/* p */}
          <Path d="M 792 668 H 820 V 681 C 827 671, 839 666, 853 666 C 880 666, 899 686, 899 716 C 899 746, 880 766, 853 766 C 840 766, 828 761, 821 752 V 798 H 792 Z M 845 689 C 831 689, 821 700, 821 716 C 821 732, 831 743, 845 743 C 860 743, 870 732, 870 716 C 870 700, 860 689, 845 689 Z" />
        </G>
      </G>
    </Svg>
  );
}
