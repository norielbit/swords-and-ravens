# Generated by Django 3.0.2 on 2020-03-24 16:14

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('agotboardgame_main', '0011_auto_20200324_1611'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='game',
            options={'permissions': [('can_play_as_another_player', 'Can impersonate an other player in a game'), ('cancel_game', 'Can cancel a game')]},
        ),
    ]
