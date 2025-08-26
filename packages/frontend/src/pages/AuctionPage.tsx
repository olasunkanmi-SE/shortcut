/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axios from "axios";
import { useCallback } from "react";
import type { Auction } from "../models/auction";
import { FormsInput } from "../components/FormInput";

export const AuctionPage: React.FC = () => {
  const [makeSearch, setmakeSearch] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [submittedQuery, setSubmittedQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [allAuctions, setAllAuctions] = useState<Auction[]>([]);

  const handleNameChange = (event: any) => {
    setmakeSearch(event.target.value);
  };

  const handleStartDateChange = (event: any) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event: any) => {
    setEndDate(event.target.value);
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    const query = `make=${encodeURIComponent(
      makeSearch
    )}&startDate=${startDate}&endDate=${endDate}`;
    setSubmittedQuery(query);
  };

  // useEffect(() => {
  //   fetchUsers();
  // }, []);

  // const fetchUsers = async () => {
  //   try {
  //     setIsLoading(true);
  //     const response = await axios.get("http://localhost:3001/api/auctions", {
  //       // Add these headers
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     console.log("r", response);
  //     // setAllAuctions(response.data.data.data);
  //     setError(null);
  //   } catch (err) {
  //     setError("Failed to fetch users");
  //     console.error("Error fetching users:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("s", submittedQuery);
      const response = await axios.get(
        `http://localhost:3001/api/auctions?${submittedQuery}`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data) {
        setIsLoading(false);
        setAuctions(response.data.data.data);
        setError(null);
      }
    } catch (error: any) {
      console.log(error);
      setError("Error fetching auction data");
    }
  }, [submittedQuery]);

  useEffect(() => {
    if (!submittedQuery) {
      return;
    }
    fetchData();
  }, [fetchData, submittedQuery]);

  //GET /auction-inventory?make=Toyota&year_min=2018
  //GET /api/cars?page=1&limit=10&sort=year&filter=make:Toyota&search=hybrid
  //fetch(`http://localhost:3000/auctions/search?searchTerm=${encodeURIComponent(searchTerm)}&startDate=${startDate}`)

  if (isLoading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="users-page">
      <h1>Auctions</h1>

      <form onSubmit={handleSubmit} className="user-form">
        <h2>Search Auction Information</h2>
        <div className="form-group">
          <FormsInput
            text={makeSearch}
            handleChange={handleNameChange}
            placeHolder="make"
          />
          <FormsInput
            text={startDate}
            handleChange={handleStartDateChange}
            placeHolder="startDate"
          />
          <FormsInput
            text={endDate}
            handleChange={handleEndDateChange}
            placeHolder="endDate"
          />

          <button type="submit">Search</button>
        </div>
      </form>

      <div className="users-list">
        <h2>All Users</h2>
        {auctions.length === 0 ? (
          <p>No auctions found.</p>
        ) : (
          <div className="users-grid">
            {auctions.map((auction) => (
              <div key={auction.id} className="user-card">
                <h3>{auction.make}</h3>
                <p>{auction.make}</p>
                <small>
                  AUCTION STARTS:{" "}
                  {new Date(auction.auction_start).toLocaleDateString()}
                </small>
                <small>
                  AUCTION ENDS:{" "}
                  {new Date(auction.auction_end).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* <div className="users-list">
        <h2>All Users</h2>
        {allAuctions.length === 0 ? (
          <p>No auctions found.</p>
        ) : (
          <div className="users-grid">
            {allAuctions.map((auction) => (
              <div key={auction.id} className="user-card">
                <h3>{auction.make}</h3>
                <p>{auction.make}</p>
                <small>
                  AUCTION STARTS:{" "}
                  {new Date(auction.auction_start).toLocaleDateString()}
                </small>
                <small>
                  AUCTION ENDS:{" "}
                  {new Date(auction.auction_end).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
};
