"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

const page = () => {
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    const fetchContacts = async () => {
      const response = await axios.get("/api/contacts");
      console.log("Fetched contacts:", response.data);
      setContacts(response.data);
    };
    fetchContacts();

    const fetchActivities = async () => {
      const response = await axios.get("/api/activities");
      console.log("Fetched activities:", response.data);
      setActivities(response.data.activities);
    };

    fetchActivities();
  }, []);

  const getContactsCreatedThisWeek = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return contacts.filter((contact) => {
      const createdAt = new Date(contact.createdAt);
      return createdAt >= oneWeekAgo;
    }).length;
  };
  return (
    <div>
      <h1>Dashboard</h1>
      <h2>Contacts {contacts.length}</h2>
      <h2>Contacts created this week: {getContactsCreatedThisWeek()}</h2>
      <h2>Activities {activities.length}</h2>
    </div>
  );
};

export default page;
