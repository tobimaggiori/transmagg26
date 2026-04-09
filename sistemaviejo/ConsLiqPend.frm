VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form ConsLiqPend 
   BackColor       =   &H80000007&
   Caption         =   "Consultas Liquidaciones Pendientes"
   ClientHeight    =   2790
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   8790
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2790
   ScaleWidth      =   8790
   Begin VB.Frame Frame1 
      BackColor       =   &H80000007&
      Caption         =   "Parámetros Consulta"
      ForeColor       =   &H000080FF&
      Height          =   2295
      Left            =   360
      TabIndex        =   0
      Top             =   240
      Width           =   8055
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000007&
         Caption         =   "Todos los Fleteros"
         ForeColor       =   &H000040C0&
         Height          =   315
         Index           =   0
         Left            =   600
         TabIndex        =   3
         Top             =   480
         Width           =   2175
      End
      Begin VB.OptionButton Option1 
         BackColor       =   &H80000007&
         Caption         =   "Un Fletero"
         ForeColor       =   &H000040C0&
         Height          =   315
         Index           =   1
         Left            =   600
         TabIndex        =   2
         Top             =   960
         Width           =   1455
      End
      Begin VB.ComboBox Combo1 
         Height          =   315
         Left            =   2160
         TabIndex        =   1
         Text            =   "Combo1"
         Top             =   960
         Width           =   4815
      End
      Begin KewlButtonz.KewlButtons Consultar 
         Height          =   495
         Left            =   2640
         TabIndex        =   4
         Top             =   1560
         Width           =   2895
         _ExtentX        =   5106
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Consultar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ConsLiqPend.frx":0000
         PICN            =   "ConsLiqPend.frx":001C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
   End
End
Attribute VB_Name = "ConsLiqPend"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Consultar_Click()
Dim Sql As String
If Option1(0).Value = True Then
    Sql = "Select * From EncabLiquidacion Where Pagada = 'NO'"
Else
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where DescFlet = '" & Combo1.Text & "'")
    Sql = "Select * From EncabLiquidacion Where Pagada = 'NO' And CodFlet = " & rsFleteros!CodFlet & ""
    Set rsFleteros = Nothing
End If

Set rsEncabLiq = db.OpenRecordset(Sql)
Set rsLiqPend = dbTemp.OpenRecordset("LiqPend")
Do While Not rsLiqPend.EOF
    rsLiqPend.Delete
    rsLiqPend.MoveNext
Loop
With rsLiqPend
Do While Not rsEncabLiq.EOF
    .AddNew
    .Fields("NroLiq") = rsEncabLiq!NroLiq
    .Fields("Fecha") = rsEncabLiq!Fecha
    .Fields("CodFlet") = rsEncabLiq!CodFlet
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsEncabLiq!CodFlet & "")
    .Fields("DescFlet") = rsFleteros!DescFlet
    Set rsFleteros = Nothing
    .Fields("TViajes") = rsEncabLiq!TViajes
    .Fields("TComision") = rsEncabLiq!TComis
    .Fields("TDesc") = rsEncabLiq!TDescuentos
    .Fields("TPagar") = rsEncabLiq!TPagar
    .Update
    rsEncabLiq.MoveNext
Loop
End With
Set rsEncabLiq = Nothing
Set rsLiqPend = Nothing
Dim frmRep As New InfLiqPend
frmRep.Show vbModal
End Sub

Private Sub Form_Load()
Set rsFleteros = db.OpenRecordset("Select * From Fleteros Order By DescFlet")
Do While Not rsFleteros.EOF
    Combo1.AddItem rsFleteros!DescFlet
    rsFleteros.MoveNext
Loop
Set rsFleteros = Nothing
Combo1.ListIndex = 0
Combo1.Enabled = False
Option1(0).Value = True
End Sub

Private Sub Option1_Click(Index As Integer)
If Index = 1 Then
    Combo1.Enabled = True
Else
    Combo1.Enabled = False
End If
End Sub

