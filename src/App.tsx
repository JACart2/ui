/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, createRef, RefObject } from "react";
import { createRoot } from "react-dom/client";


class App extends Component {
    containerRef: RefObject<HTMLDivElement>
    constructor(props: any) {
        super(props);
        this.containerRef = createRef();
    }

    render() {
        return (
            <div ref={this.containerRef}>

            </div>
        );
    }
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
