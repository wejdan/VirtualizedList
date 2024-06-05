import React, { useEffect } from "react";

const NormalList = ({ items }) => {
  useEffect(() => {
    console.time("NormalList Render");
    return () => console.timeEnd("NormalList Render");
  }, []);
  return (
    <div style={{ height: 400, overflowY: "auto" }}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            height: 35,
            boxSizing: "border-box",
            borderBottom: "1px solid #ddd",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default NormalList;
