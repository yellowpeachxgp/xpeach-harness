/** Brand artwork is embedded in the client bundle as a URL. */
declare module '*.webp' {
  const url: string
  export default url
}
