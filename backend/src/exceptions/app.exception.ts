// Error base de la API. Se mantiene el nombre AppExeption por contrato.
export class AppExeption extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
