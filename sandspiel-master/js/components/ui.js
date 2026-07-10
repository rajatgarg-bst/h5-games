import React from "react";
import ReactDOM from "react-dom";

import * as wasm from "../../crate/pkg/sandtable_bg.wasm";
import { Species } from "../../crate/pkg/sandtable";
const memory = wasm.memory;

import { height, universe, width, reset } from "../index.js";
import { pallette } from "../render.js";
import { svgToImageData, rgbaToSpecies } from "../convertSVG";
import Menu from "./menu";
import Info from "./info";

window.species = Species;
let pallette_data = pallette();

const ElementButton = (name, selectedElement, setElement) => {
  let elementID = Species[name];

  let color = pallette_data[elementID];
  let selected = elementID == selectedElement;

  let background = "inherit";
  if (elementID == 14) {
    background = `linear-gradient(45deg,
    rgba(202, 121, 125, 0.25),
    rgba(169, 120, 200, 0.25),
    rgba(117, 118, 195, 0.25),
    rgba(117, 196, 193, 0.25),
    rgba(122, 203, 168, 0.25),
    rgba(185, 195, 117, 0.25),
    rgba(204, 186, 122, 0.25))`;
    if (selected) {
      background = background.replace(/0.25/g, "1.0");
    }
  }
  return (
    <button
      className={selected ? "selected" : ""}
      key={name}
      onClick={() => {
        setElement(elementID);
      }}
      style={{
        background,
        backgroundColor: selected ? color.replace("0.25", "1.5") : color,
      }}
    >
      {"  "}
      {name}
      {"  "}
    </button>
  );
};

let sizeMap = [1, 3, 7, 19, 39];

class Index extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      paused: false,
      size: 2,
      selectedElement: Species.Water,
      showInfo: false,
      showResetConfirm: false,
    };
    window.UI = this;
    // Always auto-play on initial load (regardless of the URL path the app is
    // served from — root, /index.html, or a CDN sub-folder).
    window.paused = false;
  }

  // Open/close the Info modal via local state so the URL never changes — the
  // sim pauses while the modal is open and resumes when it closes.
  openInfo() {
    this.pause();
    this.setState({ showInfo: true });
  }
  closeInfo() {
    this.play();
    this.setState({ showInfo: false });
  }

  togglePause() {
    window.paused = !this.state.paused;
    this.setState({ paused: !this.state.paused });
  }
  play() {
    window.paused = false;
    this.setState({ paused: false });
  }
  pause() {
    window.paused = true;
    this.setState({ paused: true });
  }

  setSize(event, size) {
    event.preventDefault();
    this.setState({
      size,
    });
  }
  // Confirm via in-app modal rather than window.confirm() — when the game is
  // embedded in a cross-origin/sandboxed iframe (e.g. game portals), browsers
  // silently block native dialogs, which would make Reset appear to do
  // nothing. This works the same whether the game is opened directly or
  // embedded.
  reset() {
    this.pause();
    this.setState({ showResetConfirm: true });
  }
  confirmReset() {
    this.setState({ showResetConfirm: false });
    this.play();
    window.location = "#";
    reset();
  }
  cancelReset() {
    this.setState({ showResetConfirm: false });
    this.play();
  }

  async loadSVG(svgString) {
    const imgData = await svgToImageData(svgString);

    const cellsData = new Uint8Array(
      memory.buffer,
      universe.cells(),
      width * height * 4
    );

    reset();
    window.stopboot = true;

    for (let i = 0, len = width * height * 4; i < len; i += 4) {
      const species = rgbaToSpecies(
        imgData.data[i],
        imgData.data[i + 1],
        imgData.data[i + 2],
        imgData.data[i + 3]
      );
      cellsData[i] = species; // should be 0 to 19
      cellsData[i + 1] = Math.floor(100 + Math.random() * 50); // register A
      cellsData[i + 2] = 0; // register B
      cellsData[i + 3] = 0; // clock
    }
    universe.flush_undos();
    universe.push_undo();

    this.pause();
  }

  render() {
    let { size, paused, selectedElement, showInfo, showResetConfirm } =
      this.state;
    return (
      <React.Fragment>
        {showInfo && (
          <Menu close={() => this.closeInfo()}>
            <Info />
          </Menu>
        )}
        {showResetConfirm &&
          ReactDOM.createPortal(
            <div className="confirm-scrim">
              <div className="confirm-dialog">
                <p>Are you sure you want to reset?</p>
                <span>
                  <button onClick={() => this.confirmReset()}>Reset</button>
                  <button onClick={() => this.cancelReset()}>Cancel</button>
                </span>
              </div>
            </div>,
            document.getElementById("background")
          )}
        <button
          onClick={() => this.togglePause()}
          className={paused ? "selected" : ""}
        >
          {paused ? (
            <svg height="20" width="20" id="d" viewBox="0 0 300 300">
              <polygon id="play" points="0,0 , 300,150 0,300" />
            </svg>
          ) : (
            <svg height="20" width="20" id="d" viewBox="0 0 300 300">
              <polygon id="bar2" points="0,0 110,0 110,300 0,300" />
              <polygon id="bar1" points="190,0 300,0 300,300 190,300" />
            </svg>
          )}
        </button>

        <button onClick={() => this.reset()}>Reset</button>
        <button onClick={() => this.openInfo()}>Info</button>

        <span className="sizes">
          {sizeMap.map((v, i) => (
            <button
              key={i}
              className={i == size ? "selected" : ""}
              onClick={(e) => this.setSize(e, i)}
              style={{ padding: "0px" }}
            >
              <svg height="23" width="23" id="d" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={3 + v} />
              </svg>
            </button>
          ))}
        </span>
        <button
          onClick={() => {
            reset();
            universe.pop_undo();
          }}
          style={{ fontSize: 35 }}
        >
          ↜
        </button>
        <button
          className={-1 == selectedElement ? "selected" : ""}
          key="wind"
          onClick={() => {
            this.setState({ selectedElement: -1 });
          }}
        >
          Wind
        </button>
        {Object.keys(Species)
          .filter((x) => !Number.isInteger(Number.parseInt(x)))
          .map((n) =>
            ElementButton(n, selectedElement, (id) =>
              this.setState({ selectedElement: id })
            )
          )}
      </React.Fragment>
    );
  }
}

export { sizeMap, Index };
