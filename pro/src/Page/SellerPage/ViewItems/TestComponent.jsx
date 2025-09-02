import React from 'react';

export default function TestComponent() {
  console.log('TestComponent is rendering!');
  alert('TestComponent loaded successfully!');
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue' }}>
      <h1>Test Component</h1>
      <p>This is a test component to verify routing works.</p>
    </div>
  );
}