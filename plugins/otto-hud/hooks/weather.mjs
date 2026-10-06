// Weather icons: Meteocons by Bas Milius (https://github.com/basmilius/meteocons, @meteocons/svg 0.1.0,
// monochrome style), MIT License, Copyright (c) 2020-present Bas Milius. Animated with SMIL, every
// loop a divisor of 6 s. Changes: one tag per line, viewBox cropped to the drawing.
// The drawing is black, recolored when drawn.

export const WEATHER = {
  // clear-day
  clear: `<svg viewBox="12 12 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="clear-day">
<g id="Sun">
<circle id="Core" cx="64" cy="63.9999" r="18" stroke="black" stroke-width="4"/>
<path id="Rays" fill-rule="evenodd" clip-rule="evenodd" d="M64 16C65.1046 16 66 16.8954 66 18V30C66 31.1046 65.1046 32 64 32C62.8954 32 62 31.1046 62 30V18C62 16.8954 62.8954 16 64 16ZM30.0589 30.0589C30.8399 29.2778 32.1062 29.2778 32.8873 30.0589L41.3726 38.5442C42.1536 39.3252 42.1536 40.5915 41.3726 41.3726C40.5915 42.1536 39.3252 42.1536 38.5441 41.3726L30.0589 32.8873C29.2778 32.1062 29.2778 30.8399 30.0589 30.0589ZM97.9411 30.0589C98.7222 30.8399 98.7222 32.1062 97.9411 32.8873L89.4558 41.3726C88.6748 42.1536 87.4085 42.1536 86.6274 41.3726C85.8464 40.5915 85.8464 39.3252 86.6274 38.5442L95.1127 30.0589C95.8937 29.2778 97.1601 29.2778 97.9411 30.0589ZM16 64C16 62.8954 16.8954 62 18 62H30C31.1046 62 32 62.8954 32 64C32 65.1046 31.1046 66 30 66H18C16.8954 66 16 65.1046 16 64ZM96 64C96 62.8954 96.8954 62 98 62H110C111.105 62 112 62.8954 112 64C112 65.1046 111.105 66 110 66H98C96.8954 66 96 65.1046 96 64ZM41.3726 86.6274C42.1536 87.4085 42.1536 88.6748 41.3726 89.4558L32.8873 97.9411C32.1062 98.7222 30.8399 98.7222 30.0589 97.9411C29.2778 97.1601 29.2778 95.8937 30.0589 95.1127L38.5441 86.6274C39.3252 85.8464 40.5915 85.8464 41.3726 86.6274ZM86.6274 86.6274C87.4085 85.8464 88.6748 85.8464 89.4558 86.6274L97.9411 95.1127C98.7222 95.8937 98.7222 97.1601 97.9411 97.9411C97.1601 98.7222 95.8937 98.7222 95.1127 97.9411L86.6274 89.4558C85.8464 88.6748 85.8464 87.4085 86.6274 86.6274ZM64 96C65.1046 96 66 96.8954 66 98V110C66 111.105 65.1046 112 64 112C62.8954 112 62 111.105 62 110V98C62 96.8954 62.8954 96 64 96Z" fill="black">
<animateTransform attributeName="transform" type="rotate" values="0 64.0 64.0;360 64.0 64.0" dur="18s" begin="0s" repeatCount="indefinite"/>
</path>
</g>
</g>
</svg>`,
  // overcast
  cloudy: `<svg viewBox="12 12 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="overcast" clip-path="url(#clip0_2038_14016)">
<g id="Sky">
<g id="Clouds" clip-path="url(#clip1_2038_14016)">
<g id="Mask group">
<mask id="mask0_2038_14016" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="128" height="128">
<g id="Cloud Mask">
<path id="Subtract" fill-rule="evenodd" clip-rule="evenodd" d="M128 0H0V128H128V0ZM37.9519 93H90.9752C100.227 93 107.998 85.353 107.998 76.0281C107.998 68.0217 102.305 61.3501 94.9248 59.5512C95.3619 49.9005 89.6744 40.6093 80.5509 36.7922C71.1071 32.8411 60.0664 35.6119 53.5305 43.2384C48.5702 41.5956 42.9815 42.2957 38.5741 45.2907C34.1459 48.2998 31.4305 53.2809 31.1846 58.5379C24.0633 61.463 19.3278 68.8506 20.0776 76.7839C20.942 85.9295 28.8285 93.0018 37.9519 93Z" fill="black">
<animateTransform attributeName="transform" type="translate" values="0 -3;0 0;0 -3" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</path>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</g>
</mask>
<g mask="url(#mask0_2038_14016)">
<g id="Secondary Cloud">
<path id="Cloud" d="M101.194 55.5696C102.367 51.0603 99.7602 46.4356 95.5043 44.7274C91.1919 42.9965 85.9612 44.4886 83.4186 48.4349C81.2648 47.1923 78.496 47.2622 76.4119 48.6208C74.3808 49.945 73.2434 52.3815 73.675 54.7869C70.2998 55.3987 67.6874 58.4746 68.0307 61.9597C68.3748 65.4526 71.5394 68.0008 74.9767 68C83.8126 68 92.6514 67.9924 101.488 68C104.911 68 108 65.2865 108 61.7777C108 58.1488 104.721 55.4219 101.194 55.5696Z" fill="black"/>
<animateTransform attributeName="transform" type="translate" values="0 -3;0 0;0 -3" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</g>
</g>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</g>
<g id="Cloud_2">
<path id="Cloud_3" fill-rule="evenodd" clip-rule="evenodd" d="M54.8371 48.2115C51.0739 45.9483 46.3457 45.7826 42.4415 47.6664C41.8837 47.9355 41.3428 48.2465 40.8239 48.5991C36.6826 51.4133 34.4998 56.5151 35.3499 61.454C28.3907 62.7689 23.3936 69.3412 24.0614 76.4076C24.7293 83.474 30.8678 89.0011 37.9519 89C37.9516 89 37.9522 89 37.9519 89H90.9767C91.8608 89 92.7273 88.908 93.5669 88.7333C95.0531 88.4239 96.4547 87.855 97.7196 87.0774C99.3131 86.0979 100.689 84.787 101.744 83.2465C102.32 82.4049 102.801 81.4947 103.168 80.5324C103.705 79.125 104 77.6063 104 76.0281C104 75.9138 103.998 75.7997 103.995 75.6861C103.84 69.9006 99.7434 65.0366 94.3906 63.5447C93.1158 63.1894 91.7697 63.0253 90.3886 63.0856C90.7211 61.752 90.9017 60.4069 90.9409 59.0706C91.1716 51.1861 86.4764 43.6067 79.0085 40.4823C70.2648 36.824 59.8274 40.138 54.8371 48.2115ZM90.9767 84.9973C95.8649 84.9973 100 80.8788 100 76.0281C100 71.6531 96.6498 67.9178 92.4216 67.2003C92.1196 67.1491 91.8131 67.1132 91.503 67.0937C91.1929 67.0741 90.8793 67.0708 90.5629 67.0846L87.8866 67.2014C87.2562 67.229 86.6497 66.9571 86.2505 66.4681C85.8513 65.979 85.7062 65.3301 85.859 64.7174L86.5076 62.1165C86.6209 61.6622 86.7117 61.206 86.7808 60.7491C87.8172 53.8959 83.9585 46.8917 77.4656 44.1752C70.5246 41.2712 62.1884 43.9274 58.239 50.3171L57.2003 51.9975C57.2001 51.998 57.1998 51.9984 57.1995 51.9989C56.6234 52.9294 55.4069 53.2241 54.4692 52.6602L52.7767 51.6424C49.8116 49.8592 45.9319 49.9664 43.071 51.9105C42.7147 52.1526 42.3793 52.4199 42.0664 52.7088C39.8756 54.7312 38.7824 57.8152 39.2918 60.7745L39.6259 62.7154C39.626 62.7158 39.626 62.7162 39.6261 62.7166C39.8107 63.7928 39.0991 64.8185 38.0269 65.0216C38.0266 65.0217 38.0271 65.0216 38.0269 65.0216L36.092 65.3872C31.1413 66.3226 27.5724 71.0449 28.0437 76.0307C28.5152 81.0199 32.9092 84.9983 37.9519 84.9973H90.9767Z" fill="black"/>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</g>
</g>
</g>
</g>
<defs>
<clipPath id="clip0_2038_14016">
<rect width="128" height="128" fill="white"/>
</clipPath>
<clipPath id="clip1_2038_14016">
<rect width="128" height="128" fill="white"/>
</clipPath>
</defs>
</svg>`,
  // rain
  showers: `<svg viewBox="12 12 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="rain" clip-path="url(#clip0_2038_14032)">
<g id="Sky">
<g id="Clouds">
<g id="Cloud">
<path id="Cloud_2" fill-rule="evenodd" clip-rule="evenodd" d="M54.8371 48.2115C59.8274 40.138 70.2648 36.824 79.0085 40.4823C87.7416 44.136 92.6836 53.8827 90.3886 63.0856C97.6828 62.7671 104 68.7067 104 76.0281C104 83.1158 98.0476 89 90.9767 89C89.8721 89 88.9767 88.104 88.9767 86.9986C88.9767 85.8933 89.8721 84.9973 90.9767 84.9973C95.8637 84.9973 100 80.8799 100 76.0281C100 71.0262 95.6222 66.8637 90.5629 67.0846L87.8866 67.2014C87.2562 67.229 86.6497 66.9571 86.2505 66.4681C85.8513 65.979 85.7062 65.3301 85.859 64.7174L86.5076 62.1165C88.3201 54.8484 84.391 47.0727 77.4656 44.1752C70.5248 41.2713 62.1886 43.9272 58.239 50.3171L57.2003 51.9975C56.6245 52.9291 55.4074 53.2244 54.4692 52.6602L52.7767 51.6424C49.8116 49.8592 45.9319 49.9664 43.071 51.9105C40.2208 53.8474 38.7096 57.3922 39.2918 60.7745L39.6259 62.7154C39.8113 63.7924 39.0991 64.819 38.026 65.0218L36.092 65.3872C31.1421 66.3225 27.5723 71.0441 28.0437 76.0307C28.5153 81.0207 32.91 84.9983 37.9519 84.9973C39.0565 84.997 39.9521 85.8929 39.9524 86.9982C39.9526 88.1035 39.0573 88.9998 37.9528 89C30.8695 89.0015 24.7294 83.4755 24.0614 76.4076C23.3936 69.3412 28.3907 62.7689 35.3499 61.454C34.4997 56.5148 36.6828 51.4131 40.8239 48.5991C44.9752 45.7781 50.5363 45.625 54.8371 48.2115Z" fill="black"/>
</g>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</g>
</g>
<g id="Precipitation">
<g id="Raindrops">
<path id="Raindrop 1" d="M52 83V95" stroke="black" stroke-width="4" stroke-linecap="round">
<animateTransform attributeName="transform" type="translate" values="0 0;0 20" dur="1s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 1 1"/>
<animate attributeName="opacity" values="0;1;1;0" dur="1s" begin="0s" repeatCount="indefinite" keyTimes="0;0.15;0.85;1"/>
</path>
<path id="Raindrop 2" d="M64 83V95" stroke="black" stroke-width="4" stroke-linecap="round" opacity="0">
<animateTransform attributeName="transform" type="translate" values="0 0;0 20" dur="1s" begin="0.4s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 1 1"/>
<animate attributeName="opacity" values="0;1;1;0" dur="1s" begin="0.4s" repeatCount="indefinite" keyTimes="0;0.15;0.85;1"/>
</path>
<path id="Raindrop 3" d="M76 83V95" stroke="black" stroke-width="4" stroke-linecap="round" opacity="0">
<animateTransform attributeName="transform" type="translate" values="0 0;0 20" dur="1s" begin="0.8s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 1 1"/>
<animate attributeName="opacity" values="0;1;1;0" dur="1s" begin="0.8s" repeatCount="indefinite" keyTimes="0;0.15;0.85;1"/>
</path>
</g>
</g>
</g>
<defs>
<clipPath id="clip0_2038_14032">
<rect width="128" height="128" fill="white"/>
</clipPath>
</defs>
</svg>`,
  // thunderstorms-rain
  storm: `<svg viewBox="12 12 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="thunderstorms-rain" clip-path="url(#clip0_2038_14329)">
<g id="Sky">
<g id="Clouds">
<g id="Cloud">
<path id="Cloud_2" fill-rule="evenodd" clip-rule="evenodd" d="M54.837 48.2115C59.8272 40.138 70.2646 36.824 79.0084 40.4823C87.7415 44.136 92.6835 53.8827 90.3884 63.0856C97.6827 62.7671 104 68.7067 104 76.0281C104 83.1158 98.0475 89 90.9766 89C89.872 89 88.9766 88.104 88.9766 86.9986C88.9766 85.8933 89.872 84.9973 90.9766 84.9973C95.8636 84.9973 99.9999 80.8799 99.9999 76.0281C99.9999 71.0262 95.6221 66.8637 90.5628 67.0846L87.8865 67.2014C87.2561 67.229 86.6496 66.9571 86.2504 66.4681C85.8512 65.979 85.706 65.3301 85.8588 64.7174L86.5075 62.1165C88.32 54.8484 84.3908 47.0727 77.4654 44.1752C70.5247 41.2713 62.1884 43.9272 58.2389 50.3171L57.2002 51.9975C56.6244 52.9291 55.4073 53.2244 54.4691 52.6602L52.7766 51.6424C49.8115 49.8592 45.9317 49.9664 43.0709 51.9105C40.2206 53.8474 38.7095 57.3922 39.2917 60.7745L39.6258 62.7154C39.8112 63.7924 39.099 64.819 38.0259 65.0218L36.0919 65.3872C31.142 66.3225 27.5722 71.0441 28.0435 76.0307C28.5152 81.0207 32.9099 84.9983 37.9518 84.9973C39.0564 84.997 39.952 85.8929 39.9522 86.9982C39.9525 88.1035 39.0572 88.9998 37.9527 89C30.8694 89.0015 24.7293 83.4755 24.0613 76.4076C23.3934 69.3412 28.3905 62.7689 35.3498 61.454C34.4996 56.5148 36.6827 51.4131 40.8237 48.5991C44.975 45.7781 50.5361 45.625 54.837 48.2115Z" fill="black"/>
</g>
<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</g>
</g>
<g id="Precipitation">
<g id="Raindrops">
<path id="Raindrop 1" d="M52 83V95" stroke="black" stroke-width="4" stroke-linecap="round">
<animateTransform attributeName="transform" type="translate" values="0 0;0 20" dur="1s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 1 1"/>
<animate attributeName="opacity" values="0;1;1;0" dur="1s" begin="0s" repeatCount="indefinite" keyTimes="0;0.15;0.85;1"/>
</path>
<path id="Raindrop 2" d="M64 83V95" stroke="black" stroke-width="4" stroke-linecap="round" opacity="0">
<animateTransform attributeName="transform" type="translate" values="0 0;0 20" dur="1s" begin="0.4s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 1 1"/>
<animate attributeName="opacity" values="0;1;1;0" dur="1s" begin="0.4s" repeatCount="indefinite" keyTimes="0;0.15;0.85;1"/>
</path>
<path id="Raindrop 3" d="M76 83V95" stroke="black" stroke-width="4" stroke-linecap="round" opacity="0">
<animateTransform attributeName="transform" type="translate" values="0 0;0 20" dur="1s" begin="0.8s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 1 1"/>
<animate attributeName="opacity" values="0;1;1;0" dur="1s" begin="0.8s" repeatCount="indefinite" keyTimes="0;0.15;0.85;1"/>
</path>
</g>
</g>
<g id="Lightning">
<path id="Lightning Bolt" d="M60.0003 68L52 90.9092H60.0003L55.9995 110L76 83.2728H63.9996L71.9999 68H60.0003Z" fill="black">
<animate attributeName="opacity" values="1;1;0;1;0;1;0;1;1" dur="2s" begin="0s" repeatCount="indefinite" keyTimes="0;0.25;0.33;0.42;0.5;0.57;0.63;0.67;1"/>
</path>
</g>
</g>
<defs>
<clipPath id="clip0_2038_14329">
<rect width="128" height="128" fill="white"/>
</clipPath>
</defs>
</svg>`,
  // tornado
  compact: `<svg viewBox="12 12 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="tornado">
<path id="Line 5" d="M56 90H72" stroke="black" stroke-width="4" stroke-miterlimit="10" stroke-linecap="round">
<animateTransform attributeName="transform" type="translate" values="0 0;2 0;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</path>
<path id="Line 4" d="M47 77H81" stroke="black" stroke-width="4" stroke-miterlimit="10" stroke-linecap="round">
<animateTransform attributeName="transform" type="translate" values="0 0;4 0;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</path>
<path id="Line 3" d="M42 64H87" stroke="black" stroke-width="4" stroke-miterlimit="10" stroke-linecap="round">
<animateTransform attributeName="transform" type="translate" values="0 0;6 0;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</path>
<path id="Line 2" d="M37 51H91" stroke="black" stroke-width="4" stroke-miterlimit="10" stroke-linecap="round">
<animateTransform attributeName="transform" type="translate" values="0 0;8 0;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</path>
<path id="Line 1" d="M32 38H96" stroke="black" stroke-width="4" stroke-miterlimit="10" stroke-linecap="round">
<animateTransform attributeName="transform" type="translate" values="0 0;10 0;0 0" dur="3s" begin="0s" repeatCount="indefinite" calcMode="spline" keySplines=".42 0 .58 1; .42 0 .58 1"/>
</path>
</g>
</svg>`,
};
