import React from "react";

const Menu = ({ close, children }) => {
  return (
    <div className="menu-scrim">
      <div className={"menu"}>
        {children}
        <span className="x" onClick={close} style={{ cursor: "pointer" }}>
          <button> x</button>
        </span>
      </div>
    </div>
  );
};
export default Menu;
