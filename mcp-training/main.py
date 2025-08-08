from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Learning Info Server")

@mcp.tool()
def what_am_i_learning() -> str:
    """Responds with what the user is learning."""
    return "You are learning about MCP (Multi-Channel Processing)!"

if __name__ == "__main__":
    mcp.run(transport="stdio")