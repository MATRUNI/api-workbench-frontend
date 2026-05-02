import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { RequestContext } from '../context/RequestContext';
import './fetchComponent.css';

const API_LIBRARY = [
  {
    id: 1,
    name: "JSONPlaceholder",
    description: "Fake online REST API for testing and prototyping. Great for basic GET and POST requests.",
    endpoint: "https://jsonplaceholder.typicode.com/posts/1",
    method: "GET",
    category: "Utility"
  },
  {
    id: 2,
    name: "PokeAPI",
    description: "All the Pokémon data you'll ever need in one place. Perfect for practicing nested JSON parsing.",
    endpoint: "https://pokeapi.co/api/v2/pokemon/ditto",
    method: "GET",
    category: "Entertainment"
  },
  {
    id: 3,
    name: "ReqRes",
    description: "A hosted REST-API ready to respond to your AJAX requests. Excellent for testing User Auth.",
    endpoint: "https://reqres.in/api/users",
    method: "POST",
    category: "Auth/CRUD"
  },
{
    id: 4,
    name: "GitHub Profile",
    description: "Fetch public profile data for any GitHub user.",
    endpoint: "https://api.github.com/users/octocat",
    method: "GET",
    category: "Social"
  },
  {
    id: 5,
    name: "Bitcoin Price",
    description: "Real-time BTC price index from CoinDesk.",
    endpoint: "https://api.coindesk.com/v1/bpi/currentprice.json",
    method: "GET",
    category: "Finance"
  },
  {
    id: 6,
    name: "Rick and Morty",
    description: "Access information on characters from the show.",
    endpoint: "https://rickandmortyapi.com/api/character/1",
    method: "GET",
    category: "Entertainment"
  },
  {
    id: 7,
    name: "REST Countries",
    description: "Get information about nations, currencies, and languages.",
    endpoint: "https://restcountries.com/v3.1/name/united",
    method: "GET",
    category: "Data"
  },
  {
    id: 8,
    name: "Weather Forecast",
    description: "Current weather data for specific coordinates.",
    endpoint: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true",
    method: "GET",
    category: "Utility"
  },
  {
    id: 9,
    name: "Cat Photos",
    description: "Public API for random images of cats.",
    endpoint: "https://api.thecatapi.com/v1/images/search",
    method: "GET",
    category: "Media"
  },
  {
    id: 10,
    name: "Advice Slip",
    description: "Generates random pieces of advice.",
    endpoint: "https://api.adviceslip.com/advice",
    method: "GET",
    category: "Utility"
  }
];

function FetchComponent() {
  const { setURL, setMethod } = useContext(RequestContext);
  const navigate = useNavigate();

  const handleConfigure = (api) => {
    setURL(api.endpoint);
    navigate('/'); 
  };

  return (
    <div className="fetch-container">
      <header className="fetch-header">
        <h1>API Library</h1>
        <p>Select a pre-configured API to start testing your requests.</p>
      </header>

      <div className="api-grid">
        {API_LIBRARY.map((api) => (
          <div key={api.id} className="api-card">
            <div className="card-badge">{api.category}</div>
            <h3>{api.name}</h3>
            <p>{api.description}</p>
            <div className="endpoint-preview">
              <code>{api.method}</code>
              <span>{api.endpoint}</span>
            </div>
            <button 
              className="configure-btn" 
              onClick={() => handleConfigure(api)}
            >
              Configure in Endpoints
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FetchComponent;