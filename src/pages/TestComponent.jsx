import React from 'react';

const TestComponent = () => {
  console.log('TestComponent is rendering!');
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
      <h1>Test Component is Rendering!</h1>
      <p>If you can see this, the component is mounted.</p>
    </div>
  );
};

export default TestComponent;
