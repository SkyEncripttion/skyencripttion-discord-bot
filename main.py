import os;
import discord;
import datetime;
from discord.utils import get
from discord.ext import tasks;
from googleapiclient.discovery import build;

BOT_TOKEN = os.environ['BOT_TOKEN']
GOOGLE_API_KEY = os.environ['GOOGLE_API_KEY']

SERVER_ID = 181053990329384960
ROLES_ID = 856152205597868052

ACTION_CHANNEL_ID = 856161809051287553
STATS_CHANNEL_ID = 856141405423403028

SUBSCRIBE_EMOJI_ID = 855822359977000970
UNSUBSCRIBE_EMOJI_ID = 855822368663535656

YOUTUBE_CHANNEL_ID = "UCoEztSI7PDAwtGsUQ8Dq7Pg"
SKYENCRIPTTION_LOGO_URLS = "https://i.imgur.com/XxAmEyj.jpeg"

R = 47
G = 49
B = 54

status = False
count_status = 0

bot = discord.Client()

class Colors:
    MENU = "\033[1;31;40m"
    TEXT = "\033[1;34;40m"
    DESC = "\033[1;37;40m"
    GREEN = "\033[1;32;40m"

def check_before_run():

    if BOT_TOKEN == "":
        print('Missing BOT Token Value')
        quit()
        
    if GOOGLE_API_KEY == "":
        print('Missing Google API Key')
        quit()

async def post_message(message_id):

    guild = await bot.fetch_guild(SERVER_ID)
    channel = await bot.fetch_channel(ACTION_CHANNEL_ID)

    subscribe = await guild.fetch_emoji(SUBSCRIBE_EMOJI_ID)
    unsubscribe = await guild.fetch_emoji(UNSUBSCRIBE_EMOJI_ID)

    if message_id != "":
        message = await channel.fetch_message(message_id)
        await message.delete()

    embed = discord.Embed()

    title = "SkyEncripttion Youtube Notification Squad"
    description = "React dengan emoji <:subscribe:855769012512096256> untuk mendapatkan notifikasi mengenai video baru, jadwal dan livestream.\n\nUntuk unsubscribe bisa react dengan emoji <:unsubscribe:855769023491735554>."

    embed.title = title
    embed.description = description
    embed.color = discord.Color.from_rgb(R, G, B)

    message = await channel.send(embed = embed)
    file = open("latest_roles_id.mem", "w+")
    file.writelines(str(message.id))
    file.close()

    await message.clear_reactions()

    await message.add_reaction(subscribe)
    await message.add_reaction(unsubscribe)

async def live_counter(message_id):

    embed = discord.Embed()

    embed.title = "Fetching info..."
    embed.color = discord.Color.from_rgb(R, G, B)

    channel = await bot.fetch_channel(STATS_CHANNEL_ID)

    if message_id == "":
        message = await channel.send(embed = embed)
        file = open("latest_stats_id.mem", "w+")
        file.writelines(str(message.id))
        file.close()
    
    else:
        message = await channel.fetch_message(message_id)

    edit_test.start(message)

@bot.event
async def on_ready():

    print("SkyEncripttion BOT is now running.")

    file = open("latest_roles_id.mem", "r")
    message_id = file.readline()
    await post_message(message_id)

    file = open("latest_stats_id.mem", "r")
    message_id = file.readline()
    await live_counter(message_id)

    file.close()

@bot.event
async def on_reaction_add(reaction, user):

    if user.bot:
        return

    file = open("latest_roles_id.mem", "r")
    message_id = file.readline()

    # Compare string to string because reaction.message.id return integer
    if str(reaction.message.id) != message_id:
        return

    global status

    if status:
        return

    status = True

    guild = await bot.fetch_guild(SERVER_ID)

    subscribe = await guild.fetch_emoji(SUBSCRIBE_EMOJI_ID)
    unsubscribe = await guild.fetch_emoji(UNSUBSCRIBE_EMOJI_ID)

    roles = guild.get_role(ROLES_ID)

    react = reaction.emoji
    message = reaction.message

    if react == subscribe:
        await user.add_roles(roles)

        await message.clear_reactions()

        await message.add_reaction(subscribe)
        await message.add_reaction(unsubscribe)

        status = False

    if react == unsubscribe:
        await user.remove_roles(roles)

        await message.clear_reactions()

        await message.add_reaction(subscribe)
        await message.add_reaction(unsubscribe)

        status = False

# YouTube Statistic Task
# Run every 60 seconds
@tasks.loop(seconds = 60)
async def edit_test(message):

    youtube = build('youtube', 'v3', developerKey = GOOGLE_API_KEY)
    
    request = youtube.channels().list(
        part="statistics",
        id = YOUTUBE_CHANNEL_ID
    )

    response = request.execute()
    
    subscriber_count = response["items"][0]['statistics']['subscriberCount']
    view_count = response["items"][0]['statistics']['viewCount']
    video_count = response["items"][0]['statistics']['videoCount']

    embed = discord.Embed()

    embed.title = "SkyEncripttion - S1 Project Revivae"

    ## WARNING: This description has invisible character in the start and end (Alt +0173)
    embed.description = "­­\n**" + subscriber_count + "** Subscriber\n" + "**" + view_count + "** Total Views\n" + "**" + video_count +"** Video Uploaded\n­­"

    embed.color = discord.Color.from_rgb(R, G, B)
    embed.set_thumbnail(url = SKYENCRIPTTION_LOGO_URLS)

    embed.timestamp = datetime.datetime.utcnow()
    embed.set_footer(text = "Last updated")

    channel_name = subscriber_count + "-subscriber"

    await message.edit(embed = embed)

    global count_status

    # Only update channel name if subscriber count is different
    if count_status == subscriber_count:
        return

    channel = await bot.fetch_channel(STATS_CHANNEL_ID)
    await channel.edit(name = channel_name)
    subscriber_count = video_count

check_before_run()
bot.run(BOT_TOKEN)