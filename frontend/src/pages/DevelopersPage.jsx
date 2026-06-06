import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function DevelopersPage() {
  const [developers, setDevelopers] = useState([]);
  const [search, setSearch] = useState("");

  const fetchDevelopers = async (query = "") => {
    try {
      const response = await axios.get(
        `/api/users?query=${query}`
      );

      setDevelopers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "2rem"
      }}
    >
      {/* Hero Section */}

      <div
        className="glass-panel"
        style={{
          padding: "2rem",
          marginBottom: "2rem",
          textAlign: "center"
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "800",
            marginBottom: "0.5rem"
          }}
        >
          Discover Developers
        </h1>

        <p
          style={{
            color: "var(--text-muted)",
            marginBottom: "1rem"
          }}
        >
          Find developers, collaborators and mentors
        </p>

        <p
          style={{
            color: "var(--text-muted)",
            marginBottom: "1.5rem"
          }}
        >
          {developers.length} Developer
          {developers.length !== 1 ? "s" : ""} Found
        </p>

        <input
          type="text"
          placeholder="Search developers by name or skill..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchDevelopers(e.target.value);
          }}
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "14px 18px",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            outline: "none",
            fontSize: "1rem"
          }}
        />
      </div>

      {/* Empty State */}

      {developers.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: "3rem",
            borderRadius: "18px",
            textAlign: "center"
          }}
        >
          <div
            style={{
              fontSize: "4rem",
              marginBottom: "1rem"
            }}
          >
            🔍
          </div>

          <h2
            style={{
              marginBottom: "1rem"
            }}
          >
            No developers found
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: "1.5rem"
            }}
          >
            Try searching for popular technologies
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "10px"
            }}
          >
            {["React", "Node.js", "MongoDB", "Python"].map(
              (tech) => (
                <button
                  key={tech}
                  onClick={() => {
                    setSearch(tech);
                    fetchDevelopers(tech);
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "20px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      "rgba(99,102,241,0.15)",
                    color: "white",
                    fontWeight: "600"
                  }}
                >
                  {tech}
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.5rem"
          }}
        >
          {developers.map((user) => (
            <div
              key={user._id}
              className="glass-panel"
              style={{
                padding: "1.5rem",
                borderRadius: "18px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                transition: "0.3s ease"
              }}
            >
              <img
                src={
                  user.avatarUrl ||
                  `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`
                }
                alt={user.username}
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: "1rem"
                }}
              />

              <h2
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "0.5rem"
                }}
              >
                @{user.username}
              </h2>

              <p
                style={{
                  color: "var(--text-muted)",
                  minHeight: "50px"
                }}
              >
                {user.bio || "No bio added yet"}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "1rem",
                  marginBottom: "1rem"
                }}
              >
                {user.skills?.length > 0 ? (
                  user.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        background:
                          "rgba(99,102,241,0.15)",
                        fontSize: "0.8rem"
                      }}
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.85rem"
                    }}
                  >
                    No skills added
                  </span>
                )}
              </div>

              <p
                style={{
                  color: "var(--text-muted)",
                  marginBottom: "1rem"
                }}
              >
                👥 {user.followersCount || 0} Followers
              </p>

              <Link
                to={`/profile/${user.username}`}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  background:
                    "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  color: "white",
                  fontWeight: "600"
                }}
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DevelopersPage;