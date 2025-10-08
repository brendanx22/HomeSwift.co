import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../api';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getProperties().then(data => {
      setProperties(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Properties</h2>
      <div className="grid">
        {properties.map(p => (
          <div key={p.id} className="card">
            <h3>{p.title}</h3>
            <p>{p.location}</p>
            <p><strong>₦{p.price}</strong></p>
            <Link to={`/properties/${p.id}`}><button>View</button></Link>
          </div>
        ))}
      </div>
    </div>
  );
}
