MCP is an open protocol that standardizes how applications provide context to LLMs. Think of MCP like a USB-C port for AI applications. Just as USB-C provides a standardized way to connect your devices to various peripherals and accessories, MCP provides a standardized way to connect AI models to different data sources and tools.


Why MCP?

MCP helps you build agents and complex workflows on top of LLMs. LLMs frequently need to integrate with data and tools, and MCP provides:

    A growing list of pre-built integrations that your LLM can directly plug into
    The flexibility to switch between LLM providers and vendors
    Best practices for securing your data within your infrastructure


https://modelcontextprotocol.io/introduction  
https://docs.cursor.com/context/mcp  
https://github.com/modelcontextprotocol/quickstart-resources  

There are 2 types of MCP Servers
_____
1. There are servers that are running locally in our machines.  
2. There are remote servers deployed in the cloud or else where.  

https://github.com/modelcontextprotocol/quickstart-resources

https://docs.cursor.com/context/mcp

![image](Images/mcp.png)

![image](Images/mcpprotocol.png)

![image](Images/mcpall.png). 

Community built MCP Servers : https://mcp.so/?tab=latest

What does MCP Server exposes : 
![image](Images/mcpexposes.png).  


MCP Servers can run via : 
1. Stdio : Standard input output.  
2. SSE : Server Sent Event.  
3. Also as Docker Containers. 

Any application can be both an MCP Server & Client.   

### MCP INSPECTOR.  
It's an interactive developer tool for testing and debugging MCP Servers. Also seeing the tools etc.  

https://modelcontextprotocol.io/docs/tools/inspector   

https://github.com/modelcontextprotocol/inspector

### LLM.txt  

https://langchain-ai.github.io/langgraph/llms-txt-overview/

Cursor Directory

https://cursor.directory/rules/python