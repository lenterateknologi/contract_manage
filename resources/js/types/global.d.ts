import * as React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'lottie-player': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    src?: string;
                    background?: string;
                    speed?: string;
                    style?: React.CSSProperties;
                    loop?: boolean;
                    autoplay?: boolean;
                    mode?: string;
                },
                HTMLElement
            >;
        }
    }
}
