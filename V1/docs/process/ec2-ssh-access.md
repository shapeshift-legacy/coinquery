# CoinQuery - SSH Security

## Summary

CoinQuery AWS instances require Yubikey MFA (multi-factor authentication) for SSH access.


## Login to an EC2 instance:

```
ssh -A {username}@bastion1.redacted.example.com
YubiKey for `username': (tap)

ssh username@redacted.example.com
YubiKey for `username': (tap)
```

## Network architecture

The bastion server protects the EC2 instances by requiring that the user log in to the bastion first.  There are two bastion servers for redundancy.  EC2 instances only accept SSH connections from the bastion.  SSH forwarding is used to authenticate on the second hop.

When a new EC2 instance is deployed, it runs `userdata.sh` and `yubikey-setup.sh` which pulls down public keys from an S3 bucket:
[https://s3.console.aws.amazon.com/s3/buckets/pubkeys-ssh](https://s3.console.aws.amazon.com/s3/buckets/pubkeys-ssh)

```
                           CoinQuery VPC

                          +----------------------------------------------------------------+
                          |                                                                |
                          |     Bastion Servers                                            |
                          |                                                                |
                          |   +--------------------------+                                 |
                          |   |                          |                                 |
                          |   |                          |   ssh                           |
                          |   |  bastion1.redacted.example.com  +----------+                      |
                          |   |                          |          |                      |
+---------------------+   |   |                          |      +---v-----------------+    |
|                     |   |   +------^-------------------+      |                     |    |
|                     |   | ssh -A   |                          |                     |    |
|     Dev laptop      +--------------+                          |     EC2 instance    |    |
|                     |   |          |                          |                     |    |
|                     |   |   +------v-------------------+      |                     |    |
+---------------------+   |   |                          |      +---^-----------------+    |
                          |   |                          |          |                      |
                          |   |  bastion2.redacted.example.com  +----------+                      |
                          |   |                          |                                 |
                          |   |                          |                                 |
                          |   +--------------------------+                                 |
                          |                                                                |
                          |                                                                |
                          +----------------------------------------------------------------+
```


* Key files on the client:  
`~/.ssh/known_hosts` - contains ECDSA key fingerprints of remote servers that the client has previously connected to

* Key files on the server:  
`~/.ssh/authorized_keys` - contains a list of public keys that will be accepted  
`/etc/ssh/yubikey_mappings` - contains a list of Token IDs that will be accepted  

## Setting up your local environment

In the steps below, we will extract an SSH public key from the Yubikey (the private key remains on the Yubikey itself).  The pubkey is then saved on the server.  When the client (your machine) connects to the server, the server will challenge it to sign a message and present a Token ID (via tapping the Yubikey).  

### Versions

These instructions verified with:   
- gnupg 2.2.8   
- MacOS High Sierra & Mojave  
- Ubuntu 18.04  

Some steps are different with older versions of gnupg and Ubuntu.

### Install

1. Install gnupg and PIN support. (GPG agent will replace the default SSH agent).

MacOS  

```
brew install gnupg
brew install pinentry-mac  
```
Linux  

```
sudo apt-get install gnupg2 pcscd scdaemon 
```

2. If setting up yubikey for the first time, generate a key:  
`gpg --gen-key`

3. Otherwise, export your GPG SSH key  
`gpg --list-keys`  

* Example:

```
pub   rsa2048 2018-08-22 [SC] [expires: 2020-08-21]
      5CD4DAF40B368............................75A0FD2E85   < ----- key id
uid           [ultimate] Mike Pratt <mike@ideasbynature.com>
sub   rsa2048 2018-08-22 [E] [expires: 2020-08-21]
sub   rsa2048 2018-08-22 [A] [expires: 2020-08-21]
```

4.  Export an ssh key from the rsa2048 or rsa4096 pubkey on your Yubikey and make it read-only:  

```
gpg --export-ssh-key 5CD4DAF40B368C694665AB457801CA75A0FD2E85 > {aws username}.pub
chmod 400 {aws username}.pub
```

* Example:

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDKh0WK5KEn9NvMIcaUlbRYZBfc9PkPoat6tI9WGkEMwktYEp2xjERy1A3Ls
wGJIpyMLs67FpYpwWQ5rsVmJ7B0AiCDXcQDq5pdcM/+Pfqm60cUdfSUgRXS5Twg5RECOvO/ti1PI3Fs46GYsDqfOzgZFQqZV
vHBTrUnXDSmst2j3UucFXlGXEEyZs/YIrEd5raracpqXyY1AiCSv+qVKbiPmRf+S9i2IxJpBynMl84stCPl7AE8qg3QDfqn4z
Yqt6kru1U+iZERVjVkLvCF/9JK8ywhi7CF4zmBY2fa7DyHVTqcNwDM9Pz19TF0kouS731aFtQ54k1X4dFEGYbVEC8J 
cardno:000607075134
```

5. Add the following lines to the GPG Agent Configuration File `~/.gnupg/gpg-agent.conf`:

MacOS

```
pinentry-program /usr/local/bin/pinentry-mac
enable-ssh-support
```
Linux

```
enable-ssh-support
```

6. Switch your default agent from `ssh-agent` to `gpg-agent`.  Add these lines to `~/.bash_profile`:  

MacOS

```
export GPG_TTY=$(tty)
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
```

Linux  
[http://www.engineerbetter.com/blog/yubikey-ssh](http://www.engineerbetter.com/blog/yubikey-ssh)

```
cat <<EOF >> ~/.bashrc
export GPG_TTY=$(tty)
gpg-connect-agent updatestartuptty /bye
unset SSH_AGENT_PID
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
EOF
```

7. Restart the agent:    
 `gpg-connect-agent reloadagent /bye`

8. Keep this terminal open and Start a new terminal to make sure the gpg-agent is started automatically.

9. Verify pubkey accessible to the `gpg-agent`  

```
ssh-add -L  
```

10. Verify GPG Agent config

```
printenv |grep SSH_AUTH_SOCK
```

Should be similar to: 
`/Users/{user}/.gnupg/S.gpg-agent.ssh`

11. Test

```
ssh -A {username}@bastion1.redacted.example.com
YubiKey for {username': (tap)

ssh {username}@{ec2 ip address}
YubiKey for {username}: (tap)
```

## Account Maintenance

### Add a user
1. Generate Token ID by tapping the Yubikey in a text editor and taking the 1st 12 letters.  The Yubikey acts as a keyboard to generate one time passwords.  The first 12 letters are the Token ID and are always the same.  Save in a new file called `<aws-username>-yubi-tokenid.txt`  

* Format:  

```
ccccccgttnil:username  
```

2. Upload your public key `<aws-username>-yubi-ssh.pub` and Token ID `<aws-username>-yubi-tokenid.txt` to the following CoinQuery S3 bucket:  
[https://s3.console.aws.amazon.com/s3/buckets/pubkeys-ssh](https://s3.console.aws.amazon.com/s3/buckets/pubkeys-ssh)    


3. Add user to deployed EC2 instances via TBD

### Remove a user

1. Remove a user from deployed EC2 instances via TBD


## Troubleshooting

### General  

Some general debugging steps

* Add `-vvv` for verbose mode

```
ssh -A {username}@bastion1.redacted.example.com -vvv
```

* Check Yubikey settings

```
gpg --card-status
```

* Restart the GPG connection agent

```    
gpg-connect-agent reloadagent /bye
```

### Error - Permission Denied

```
ec2-userd@bastion2.redacted.example.com: Permission denied (publickey)
```
This is the most common error message.  It indicates that the pubkey offered by the client couldn't be verified by the server.  There are many possible reasons: key not available to the client `gpg-agent`, wrong key in the `authorized_keys` file on the server, incorrect username, etc.  

Double check the setup steps above.


### Error - Agent Refused Operation  

```
sign_and_send_pubkey: signing failed: agent refused operation
```
Typically this means the gpg-agent is not connected



### Error - Remote Host Identification Has Changed

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ECDSA key sent by the remote host is
SHA256:vjfYn0WpS2EtPtJgw9HwBuARM86aw85tmqP0yF0s/PM.
Please contact your system administrator.
Add correct host key in /Users/mike/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /Users/mike/.ssh/known_hosts:2
ECDSA host key for bastion1.redacted.example.com has changed and you have requested strict checking.
Host key verification failed.
```

You'll get this error if the bastion server has been redeployed.  To fix, remove the host from `~/.ssh/known_hosts` on the client side

## References

[https://medium.com/@ahawkins/securing-my-digital-life-gpg-yubikey-ssh-on-macos-5f115cb01266](https://medium.com/@ahawkins/securing-my-digital-life-gpg-yubikey-ssh-on-macos-5f115cb01266)  

[http://www.engineerbetter.com/blog/yubikey-ssh](http://www.engineerbetter.com/blog/yubikey-ssh)