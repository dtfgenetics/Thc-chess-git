"use client";

export default function Guest({ currentName }: { currentName: string }) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">Welcome, {currentName}!</span>
      </label>
      <label className="input-group">
        <span>Grower</span>
        <input
          type="text"
          pattern="[A-Za-z0-9]+"
          title="Alphanumeric characters only"
          id="guestName"
          name="guestName"
          placeholder="Enter grower name..."
          className="input input-bordered w-full"
          maxLength={16}
          minLength={2}
          required
        />
      </label>
    </div>
  );
}
