"use client";

export default function Login() {
  return (
    <div className="form-control">
      <label htmlFor="loginName" className="label">
        <span className="label-text">Grower name or email</span>
      </label>
      <input
        type="text"
        title="Enter your grower name or email address"
        id="loginName"
        name="loginName"
        placeholder="grower name or email"
        className="input input-bordered"
        maxLength={128}
        minLength={2}
        autoComplete="username"
        required
      />
      <label htmlFor="loginPassword" className="label">
        <span className="label-text">Password</span>
      </label>
      <input
        type="password"
        id="loginPassword"
        name="loginPassword"
        placeholder="password"
        className="input input-bordered"
        maxLength={128}
        minLength={3}
        autoComplete="current-password"
        required
      />
    </div>
  );
}
