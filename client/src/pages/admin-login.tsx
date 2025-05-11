import React from "react";
import { Redirect } from "wouter";

export default function AdminLogin() {
  // Redirect to the main auth page
  return <Redirect to="/auth" />;
}