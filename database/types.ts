// Fields every saved document gets on top of its own: `timestamps: true`
// adds createdAt and updatedAt. Each model's IXDoc extends this.
export interface SavedDoc {
  createdAt: Date;
  updatedAt: Date;
}
