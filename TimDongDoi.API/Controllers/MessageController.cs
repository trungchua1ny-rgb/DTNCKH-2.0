using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TimDongDoi.API.DTOs.Message;
using TimDongDoi.API.Services.Interfaces;

namespace TimDongDoi.API.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    // GET /api/messages/conversations
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _messageService.GetConversations(userId);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // GET /api/messages/conversations/{otherUserId}
    [HttpGet("conversations/{otherUserId}")]
    public async Task<IActionResult> GetMessages(
        int otherUserId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _messageService.GetMessages(userId, otherUserId, page, pageSize);
            return Ok(new { success = true, data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // POST /api/messages
    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _messageService.SendMessage(userId, request);
            return Ok(new { success = true, message = "Message sent", data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // PUT /api/messages/conversations/{otherUserId}/read
    [HttpPut("conversations/{otherUserId}/read")]
    public async Task<IActionResult> MarkAsRead(int otherUserId)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _messageService.MarkAsRead(userId, otherUserId);
            return Ok(new { success = true, message = "Messages marked as read" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // DELETE /api/messages/{messageId}
    [HttpDelete("{messageId}")]
    public async Task<IActionResult> DeleteMessage(int messageId)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _messageService.DeleteMessage(userId, messageId);
            return Ok(new { success = true, message = "Message deleted" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // GET /api/messages/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        try
        {
            var userId = GetCurrentUserId();
            var count = await _messageService.GetTotalUnreadCount(userId);
            return Ok(new { success = true, data = new { unreadCount = count } });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}