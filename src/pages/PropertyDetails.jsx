import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API } from '../api';

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    API.getProperty(id).then(data => setProperty(data)).catch(console.error);
  }, [id]);

  if (!property) return <div>Loading...</div>;

  return (
    <div className='card'>
      <h2>{property.title}</h2>
      <p>{property.description}</p>
      <p><strong>Location:</strong> {property.location}</p>
      <p><strong>Price:</strong> ₦{property.price}</p>
    </div>
  );
}
